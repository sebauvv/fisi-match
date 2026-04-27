provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# 1. IAM Role para Lambda (Sin usar usuarios de IAM estáticos)
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  name               = "${var.lambda_function_name}_ExecutionRole"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# 2. Attach AWS Lambda Basic Execution Role (permisos para logs en CloudWatch)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 3. Custom Policy para Amazon Bedrock (Nova Lite)
resource "aws_iam_policy" "lambda_bedrock_policy" {
  name        = "${var.lambda_function_name}_BedrockPolicy"
  description = "Permite a la Lambda invocar modelos en Bedrock"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["bedrock:InvokeModel"]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_bedrock_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_bedrock_policy.arn
}

# 4. La función Lambda de AWS
resource "aws_lambda_function" "advisor_recommender" {
  function_name    = var.lambda_function_name
  filename         = "${path.module}/lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda.zip")
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.10"
  timeout          = 180 # Bedrock LLM requests can take some time
  memory_size      = 256

  # Variables de Entorno (Aqui se ignorará el .env y usara variables nativas de Lambda)
  environment {
    variables = {
      MODE         = "cloud"
      DB_HOST      = var.db_host
      DB_PORT      = var.db_port
      DB_NAME      = var.db_name
      DB_USER      = var.db_user
      DB_PASSWORD  = var.db_password
      DATABASE_URL = var.db_url

      EMBEDDING_MODEL      = var.embedding_model
      EMBEDDING_DIMENSIONS = var.embedding_dimensions
      LLM_MODEL            = var.llm_model
      RECENCY_BOOST        = var.recency_boost
      CHUNKS_PER_ADVISOR   = var.chunks_per_advisor
      TOP_K                = var.top_k
      KNN_LIMIT            = var.knn_limit
    }
  }
}

output "lambda_arn" {
  value = aws_lambda_function.advisor_recommender.arn
}

output "lambda_role_id" {
  value = aws_iam_role.lambda_role.id
}

# IAM User para invocar el Lambda desde el backend (sin SSO)

resource "aws_iam_user" "backend_invoker" {
  name = "${var.lambda_function_name}_BackendInvoker"
}

resource "aws_iam_policy" "backend_invoke_policy" {
  name        = "${var.lambda_function_name}_InvokePolicy"
  description = "Permite al backend de FastAPI invocar el Lambda de recomendacion"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["lambda:InvokeFunction"]
        Resource = aws_lambda_function.advisor_recommender.arn
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "backend_invoker_attach" {
  user       = aws_iam_user.backend_invoker.name
  policy_arn = aws_iam_policy.backend_invoke_policy.arn
}

resource "aws_iam_access_key" "backend_invoker_key" {
  user = aws_iam_user.backend_invoker.name
}

output "backend_invoker_access_key_id" {
  description = "Agregar como ADVISOR_LAMBDA_ACCESS_KEY_ID en el .env del backend"
  value       = aws_iam_access_key.backend_invoker_key.id
}

output "backend_invoker_secret_access_key" {
  description = "Agregar como ADVISOR_LAMBDA_SECRET_ACCESS_KEY en el .env del backend"
  value       = aws_iam_access_key.backend_invoker_key.secret
  sensitive   = true
}

output "advisor_lambda_function_name" {
  description = "Agregar como ADVISOR_LAMBDA_FUNCTION en el .env del backend"
  value       = aws_lambda_function.advisor_recommender.function_name
}

output "advisor_lambda_region" {
  description = "Region del Lambda (AWS_REGION equivalente)"
  value       = var.aws_region
}

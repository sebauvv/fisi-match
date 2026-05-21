provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# IAM Role para Lambda (Execution Role)

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

# CloudWatch Logs
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Bedrock InvokeModel (Claude Haiku 4.5)
resource "aws_iam_policy" "lambda_bedrock_policy" {
  name        = "${var.lambda_function_name}_BedrockPolicy"
  description = "Permite a la Lambda invocar modelos en Bedrock (Claude Haiku)"
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

# Lambda Function

resource "aws_lambda_function" "alternative_recommender" {
  function_name    = var.lambda_function_name
  filename         = "${path.module}/lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda.zip")
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.10"
  timeout          = 120
  memory_size      = 256

  environment {
    variables = {
      LLM_MODEL   = var.llm_model
      AWS_REGION_ = var.aws_region
    }
  }
}

# Credenciales estáticas para el backend de FastAPI

resource "aws_iam_user" "backend_invoker" {
  name = "${var.lambda_function_name}_BackendInvoker"
}

resource "aws_iam_policy" "backend_invoke_policy" {
  name        = "${var.lambda_function_name}_InvokePolicy"
  description = "Permite al backend FastAPI invocar el Lambda de recomendaciones alternativas"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["lambda:InvokeFunction"]
        Resource = aws_lambda_function.alternative_recommender.arn
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

# Outputs

output "lambda_arn" {
  value = aws_lambda_function.alternative_recommender.arn
}

output "lambda_function_name" {
  description = "Agregar como RECOMMENDER_LAMBDA_FUNCTION en el .env del backend"
  value       = aws_lambda_function.alternative_recommender.function_name
}

output "lambda_region" {
  description = "Agregar como RECOMMENDER_LAMBDA_REGION en el .env del backend"
  value       = var.aws_region
}

output "backend_invoker_access_key_id" {
  description = "Agregar como RECOMMENDER_LAMBDA_ACCESS_KEY_ID en el .env del backend"
  value       = aws_iam_access_key.backend_invoker_key.id
}

output "backend_invoker_secret_access_key" {
  description = "Agregar como RECOMMENDER_LAMBDA_SECRET_ACCESS_KEY en el .env del backend"
  value       = aws_iam_access_key.backend_invoker_key.secret
  sensitive   = true
}

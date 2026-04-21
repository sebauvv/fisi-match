provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# IAM Role para Lambda

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

# Bedrock InvokeModel (Nova Lite para CV)
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

# S3 Read/Write para descargar PDFs y generar URLs publicas
resource "aws_iam_policy" "lambda_s3_policy" {
  name        = "${var.lambda_function_name}_S3Policy"
  description = "Permite a la Lambda leer y escribir en el bucket de PDFs"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["s3:GetObject", "s3:PutObject", "s3:PutObjectAcl"]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.pdf_bucket.arn}/*"
      },
      {
        Action   = ["s3:ListBucket"]
        Effect   = "Allow"
        Resource = aws_s3_bucket.pdf_bucket.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_s3_policy.arn
}

# S3 Bucket para PDFs

resource "aws_s3_bucket" "pdf_bucket" {
  bucket = var.s3_bucket_name
}

resource "aws_s3_bucket_public_access_block" "pdf_bucket_public" {
  bucket = aws_s3_bucket.pdf_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "pdf_bucket_policy" {
  bucket     = aws_s3_bucket.pdf_bucket.id
  depends_on = [aws_s3_bucket_public_access_block.pdf_bucket_public]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.pdf_bucket.arn}/*"
      }
    ]
  })
}

# IAM User para que el backend suba PDFs a S3

resource "aws_iam_user" "s3_uploader" {
  name = "student-profile-s3-user"
}

resource "aws_iam_user_policy" "s3_uploader_policy" {
  name = "S3UploadPolicy"
  user = aws_iam_user.s3_uploader.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["s3:PutObject", "s3:PutObjectAcl", "s3:GetObject"]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.pdf_bucket.arn}/*"
      }
    ]
  })
}

resource "aws_iam_access_key" "s3_uploader_key" {
  user = aws_iam_user.s3_uploader.name
}

# Lambda Function

resource "aws_lambda_function" "student_profile_reader" {
  function_name    = var.lambda_function_name
  filename         = "${path.module}/lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda.zip")
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.10"
  timeout          = 180
  memory_size      = 256

  environment {
    variables = {
      MODE        = "cloud"
      LLM_MODEL   = var.llm_model
      AWS_REGION_ = var.aws_region # AWS_REGION esta reservado en Lambda
      S3_BUCKET   = var.s3_bucket_name
    }
  }
}

# Outputs

output "lambda_arn" {
  value = aws_lambda_function.student_profile_reader.arn
}

output "lambda_function_name" {
  value = aws_lambda_function.student_profile_reader.function_name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.pdf_bucket.id
}

output "s3_bucket_url" {
  value = "https://${aws_s3_bucket.pdf_bucket.bucket}.s3.${var.aws_region}.amazonaws.com"
}

output "s3_user_access_key_id" {
  value = aws_iam_access_key.s3_uploader_key.id
}

output "s3_user_secret_access_key" {
  value     = aws_iam_access_key.s3_uploader_key.secret
  sensitive = true
}

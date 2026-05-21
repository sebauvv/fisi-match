variable "lambda_function_name" {
  type    = string
  default = "AlternativeRecommender"
}

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "aws_profile" {
  type    = string
  default = "Ecomm-Seba"
}

variable "llm_model" {
  type    = string
  default = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
}

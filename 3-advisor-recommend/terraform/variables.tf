
variable "lambda_function_name" {
  type    = string
  default = "AdvisorRecommenderEngine"
}

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "aws_profile" {
  type = string
}

variable "llm_model" {
  type = string
}

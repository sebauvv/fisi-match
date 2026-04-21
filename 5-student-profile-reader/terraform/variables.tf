variable "lambda_function_name" {
  type    = string
  default = "StudentProfileReader"
}

variable "s3_bucket_name" {
  type    = string
  default = "student-profile-pdfs-unmsm"
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
  default = "us.amazon.nova-lite-v1:0"
}

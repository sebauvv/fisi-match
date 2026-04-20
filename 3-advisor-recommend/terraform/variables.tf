
variable "lambda_function_name" {
  type    = string
  default = "AdvisorRecommenderEngine"
}

variable "db_host" {
  type = string
}

variable "db_port" {
  type = string
}

variable "db_name" {
  type = string
}

variable "db_user" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "aws_profile" {
  type = string
}

variable "embedding_model" {
  type = string
}

variable "embedding_dimensions" {
  type = string
}

variable "llm_model" {
  type = string
}

variable "top_k" {
  type = string
}

variable "recency_boost" {
  type = string
}

variable "chunks_per_advisor" {
  type = string
}

variable "knn_limit" {
  type = string
}

variable "db_url" {}

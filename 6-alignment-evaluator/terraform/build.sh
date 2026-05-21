#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$SCRIPT_DIR/package"
LAMBDA_ZIP="$SCRIPT_DIR/lambda.zip"

echo "Limpiando paquete anterior..."
rm -rf "$PACKAGE_DIR" "$LAMBDA_ZIP"
mkdir -p "$PACKAGE_DIR"

echo "Instalando dependencias de Lambda (sin psycopg2)..."
pip install \
  --platform manylinux2014_x86_64 \
  --target "$PACKAGE_DIR" \
  --implementation cp \
  --python-version 3.10 \
  --only-binary=:all: \
  "boto3>=1.35.0"

echo "Copiando codigo fuente..."
cp "$SCRIPT_DIR/../script/lambda_function.py" "$PACKAGE_DIR/"

echo "Copiando prompts..."
mkdir -p "$PACKAGE_DIR/prompts"
cp "$SCRIPT_DIR/../prompts/system_prompt.txt" "$PACKAGE_DIR/prompts/"

echo "Creando lambda.zip..."
cd "$PACKAGE_DIR"
zip -r "$LAMBDA_ZIP" . -x "*.pyc" -x "__pycache__/*"

echo "Listo: $LAMBDA_ZIP ($(du -sh "$LAMBDA_ZIP" | cut -f1))"

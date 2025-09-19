FROM python:3.9-slim

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

# Adiciona um atraso de 10 segundos antes de iniciar o app
CMD ["sh", "-c", "sleep 10 && python app.py"]

#!/bin/bash
curl \
  -X POST \
  -H "Content-Type:application/json" \
  -d '{"email":"user_1@mail.com","password":"123456"}' \
  -k \
   https://localhost:8787/auth/login \
  | jq
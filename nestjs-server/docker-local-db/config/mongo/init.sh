#!/bin/bash

ADMIN_USER="${USER_NAME:-admin}"
ADMIN_PASS="${USER_PASSWORD:-admin}"
BIND_IP="${BIND_IP:-0.0.0.0}"

# mongod 실행 (백그라운드)
mongod --bind_ip "$BIND_IP" --fork --logpath /var/log/mongodb.log

# mongod 접속 대기
RETRY=0
until mongosh --eval "db.runCommand({ ping: 1 })" &>/dev/null || [ $RETRY -eq 10 ]; do
  echo "MongoDB 대기 중..."
  RETRY=$((RETRY+1))
  sleep 2
done

# admin 유저 생성
mongosh <<EOF
use admin;
db.createUser({
  user: "$ADMIN_USER",
  pwd: "$ADMIN_PASS",
  roles: [ { role: "root", db: "admin" } ]
});
EOF

# 로그 tail 유지
tail -f /var/log/mongodb.log
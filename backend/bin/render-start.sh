#!/bin/sh
set -e

bin/rails db:migrate
bin/rails db:seed

exec bin/rails server -b 0.0.0.0 -p 3001


from node:12

workdir /app
copy . /app

run npm install

expose 3000
cmd ["/bin/bash","start.sh"]

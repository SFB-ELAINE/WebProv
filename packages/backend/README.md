# Backend
The backend for the web provenance platform.

## Development
### Installation
#### Linux
First, make sure to start up docker:
```
sudo service docker start # if docker is not already running
docker stop $(docker ps -aq) # stop all containers
docker rm $(docker ps -aq) # remove all containers

docker run \
    --name testneo4j \
    -p7474:7474 -p7687:7687 \
    -d \
    -v $HOME/neo4j/data:/data \
    -v $HOME/neo4j/logs:/logs \
    -v $HOME/neo4j/import:/var/lib/neo4j/import \
    -v $HOME/neo4j/plugins:/plugins \
    --env NEO4J_AUTH=neo4j/test \
    neo4j:latest
```

#### MacOS
First, install `neo4j`:
```
brew install neo4j
```

Then start the server:
```
neo4j start
```

Other commands include `stop`, `restart`, `console` and `status`.

### Connection Configuration
Also, create a `.env` file if you don't already have one:
```
GRAPHENEDB_BOLT_URL=bolt://localhost:7687
GRAPHENEDB_BOLT_USER=neo4j
GRAPHENEDB_BOLT_PASSWORD=test
```
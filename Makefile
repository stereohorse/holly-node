.PHONY: clean docker

all: docker

bower_components:
	bower install

node_modules:
	npm install

docker: bower_components node_modules
	docker build -t 0x06065a/holly-node:0.0.1 .

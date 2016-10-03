.PHONY: clean docker push

HOLLY_VERSION?=latest

all: docker

bower_components:
	bower install

node_modules:
	npm install

docker: bower_components node_modules
	docker build -t 0x06065a/holly-node:$(HOLLY_VERSION) .

push: docker
	docker push 0x06065a/holly-node:$(HOLLY_VERSION)

clean:
	rm -rf bower_components && rm -rf node_modules

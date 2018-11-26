docker:
	docker build -t romainfd/inf552 .
	docker push romainfd/inf552

run:
	docker run -p 8080:80 romainfd/inf552

srv:
	livereload -p 8080 .

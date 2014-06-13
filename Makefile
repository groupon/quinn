SRC = $(shell find src -name "*.js" -type f | sort)
DIST = $(SRC:src/%.js=dist/%.js)

COMPILE = ./build/compile.js

default: build

.PHONY: build test check-checkout-clean clean
build: $(DIST)

dist/%.js: src/%.js build/compile.js node_modules
	@echo "Compiling $< -> $@"
	@dirname "$@" | xargs mkdir -p
	@$(COMPILE) <"$<" >"$@"

# This will fail if there are unstaged changes in the checkout
check-checkout-clean:
	git diff --exit-code

test: build node_modules
	@./node_modules/.bin/mocha

node_modules: package.json
	npm install

clean:
	rm -rf node_modules dist

watch: node_modules
	@./node_modules/.bin/reakt -g "{src,test,build}/**/*.js" "make test"

SRC = $(shell find src -name "*.js" -type f | sort)
DIST = $(SRC:src/%.js=dist/%.js)

COMPILE = ./build/compile.js

default: build

.PHONY: build test check-checkout-clean
build: $(DIST)

dist/%.js: src/%.js build/compile.js
	@echo "Compiling $@"
	@dirname "$@" | xargs mkdir -p
	@$(COMPILE) <"$<" >"$@"

# This will fail if there are unstaged changes in the checkout
check-checkout-clean:
	git diff --exit-code

test: build
	@./node_modules/.bin/mocha

watch:
	@./node_modules/.bin/reakt -g "{src,test}/**/*.js" "make test"

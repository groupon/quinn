SRC = $(shell find src -name "*.js" -type f | sort)
DIST = $(SRC:src/%.js=dist/%.js)

COMPILE = ./build/compile.js

default: build

build: $(DIST)

dist/%.js: src/%.js build/compile.js
	dirname "$@" | xargs mkdir -p
	$(COMPILE) <"$<" >"$@"

# This will fail if there are unstaged changes in the checkout
check-checkout-clean:
	git diff --exit-code

test: build
	@mocha

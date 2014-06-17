COMPILE = ./node_modules/.bin/quinnc

default: build

# Upstream modules
.PHONY: quinnc respond router
quinnc:
	@cd node_modules/quinnc && npm install --production

respond: quinnc
	@cd node_modules/quinn.respond && make build

router: quinnc
	@cd node_modules/quinn.router && make build

.PHONY: build test check-checkout-clean clean clean-dist lint
build: respond router
	@$(COMPILE) src dist

# This will fail if there are unstaged changes in the checkout
check-checkout-clean:
	git diff --exit-code

test: build node_modules
	@./node_modules/.bin/mocha

node_modules: package.json
	@npm install

lint: build
	@./node_modules/.bin/jshint src

clean:
	rm -rf dist
	@cd node_modules/quinn.respond && make clean
	@cd node_modules/quinn.router && make clean

ALL_MODULES = $(shell find node_modules -mindepth 1 -maxdepth 1 -type d \
											! -name quinn.respond \
											! -name quinn.router \
											! -name quinnc \
											)
reinstall:
	@rm -r $(ALL_MODULES) || echo "Could not delete modules"
	@npm install

watch: node_modules
	@./node_modules/.bin/reakt -g "{src,test,build}/**/*.js" "make test"

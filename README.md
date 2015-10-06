# taco-deploy-extract

Deployment module for [taco](https://github.com/maxogden/taco) which extracts tarballs into the correct folder structure. Usefull for static applications which don't need a separate process for serving files.

	npm install -g taco-deploy-extract

# Usage

Can be used together with rest of the `taco` tool chain.

	$ cat myapp.tar.gz | taco-build "npm install --production" | taco-deploy-extract .

The application name can be provided using the `--name` option, otherwise it is read from `package.json`.

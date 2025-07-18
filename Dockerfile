# syntax=docker/dockerfile:experimental

# Build stage: Install python dependencies
# ===
FROM ubuntu:noble AS python-dependencies
RUN apt-get update && apt-get install --no-install-recommends --yes python3-pip python3-setuptools python3-venv build-essential git ca-certificates
ADD requirements.txt /tmp/requirements.txt
RUN pip3 config set global.disable-pip-version-check true
RUN python3 -m venv /venv
ENV PATH="/venv/bin:${PATH}"
RUN --mount=type=cache,target=/root/.cache/pip pip3 install --requirement /tmp/requirements.txt

# Build stage: Install yarn dependencies
# ===
FROM node:22 AS yarn-dependencies
WORKDIR /srv
ADD package.json .
ADD yarn.lock .
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn yarn install

# Build stage: Run "yarn run build-js"
# ===
FROM yarn-dependencies AS build-js
ADD static/js static/js
ADD webpack.config.js .
ADD webpack.config.entry.js .
ADD webpack.config.rules.js .
ADD tsconfig.json .
ADD babel.config.json .
RUN yarn install
RUN yarn run build-js

# Build stage: Run "yarn run build-css"
# ===
FROM yarn-dependencies AS build-css
ADD . .
RUN yarn install
RUN yarn run build-css

# Set up environment
ENV LANG C.UTF-8
WORKDIR /srv

# Build the production image
# ===
FROM ubuntu:noble

# Install python and import python dependencies
RUN apt-get update && apt-get install --no-install-recommends --yes python3-setuptools python3-lib2to3 python3-pkg-resources ca-certificates gpg
COPY --from=python-dependencies /venv /venv
ENV PATH="/venv/bin:${PATH}"

# Import code, build assets
ADD . .
RUN rm -rf package.json yarn.lock babel.config.json webpack.config.js requirements.txt
COPY --from=build-js /srv/static/js static/js
COPY --from=build-css /srv/static/css static/css

# Set build ID
ARG BUILD_ID
ENV TALISKER_REVISION_ID "${BUILD_ID}"


# Setup commands to run server
ENTRYPOINT ["./entrypoint"]
CMD ["0.0.0.0:80"]

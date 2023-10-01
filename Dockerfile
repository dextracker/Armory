FROM node:18

SHELL ["/bin/bash", "-c"]

WORKDIR /usr/

COPY package.json ./
COPY yarn.lock ./

RUN apt-get update && apt-get install -y curl python3 make g++ nano
RUN if [ ! -e /usr/bin/python ]; then ln -s /usr/bin/python3 /usr/bin/python; fi
RUN yarn global add node-gyp

RUN chsh -s /bin/bash

RUN curl -L https://foundry.paradigm.xyz | bash

RUN yarn

# Copy the rest of the application to the container
COPY . .

# Make sure backfill.sh is executable
RUN chmod +x backfill.sh

ENTRYPOINT ["sh","backfill.sh"]

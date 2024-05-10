FROM alpine:latest

RUN apk update \
&& apk upgrade \
&& apk add git curl

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]

# Simple video cms

Consists of nodejs app and minio storage.

## Build

```bash
$ make
```

### Specific version

```bash
$ make HOLLY_VERSION=1.2.3
```

By default uses 'latest'.

### Push to docker registry

```bash
$ make push HOLLY_VERSION=1.2.3
```

### Clean

```bash
$ make clean
```

## Test

```bash
$ vagrant up
```

# Horsepower Command Line Tool

* [Installation](#installation)
* Project Management
  * [New Project](#new-project)
  * [List Commands](#list-commands)
* Package Management
  * [Add Package](#add-package)
  * [Remove Package](#remove-package)
  * [List Packages](#list-packages)
* Making Components
  * [Make Controller](#make-controller)
  * [Make Middleware](#make-middleware)
* Server Management
  * [Start Server](#start-server)
  * [Stop Server](#stop-server)
  * [Server Logging](#server-logging)
  * [Server List](#server-list)

## Installation

To install the command line tool run an `npm install`

```bash
npm install -g @horsepower/cli
```

Once installed you can create projects and project files.

## New Project

New projects are created by going to the directory that you want to create a new project within. The command will then create a new directory and install everything into that directory.

```bash
horsepower new <project-name>
```

The following steps are taken:

1. `git clone` the bare bones project from [github](https://github.com/horsepowerjs/horsepower)
2. Install the node dependencies
3. Start a test server
4. Opens `http://localhost:5000` within a browser to make sure everything works

## List Commands

This allows for seeing all of the commands that are usable at the current path. This includes builtin commands and commands that are listed in a projects `app/commands` directory.

```bash
horsepower list
```

## Add Package

Adds a supported `@horsepower` package to the current project.

```bash
horsepower add <package-name>
```

The following steps are taken:

1. Check the registry to make sure the package is a horsepower package (`@horsepower/<package-name>`)
2. If the package exists, install it `npm i -s @horsepower/<package-name>`

## Remove Package

Removes a supported `@horsepower` package from the current project.

```bash
horsepower remove <package-name>
```

The following steps are taken:

1. Check the registry to make sure the package is a horsepower package (`@horsepower/<package-name>`)
2. If the package exists, remove it `npm rm -s @horsepower/<package-name>`

## List Packages

Displays a list of packages that can be installed via `package:add`.

```bash
horsepower package:list
```

## Make Controller

Make controller can create 3 different types of controllers:

* A basic controller (default)
* An API controller
* A Resource controller
---
Creates a basic controller containing only a `main` endpoint. This is the default action.
```bash
horsepower make:controller <controller-name>
```

Creates an **API controller** containing only API endpoints
```bash
horsepower make:controller <controller-name> --api
```

Creates a **Resource controller** containing all resource endpoints
```bash
horsepower make:controller <controller-name> --resource
```

## Make Middleware

Make Middleware will make middleware that can then be hooked into within your routes.

```bash
horsepower make:middleware <middleware-name>
```

## Start Server

Starts an instance of a horsepower server application. This command will not hang the terminal and will start the server in the background. A `pid` will be written to the `horsepower.json` file in order to stop the service upon `server:stop`.

The server will watch for file changes in: `app`, `config` and `routes`. When a file changes the server will restart with the new changes.

**Note:** Calling `server:start` repeatedly on the same project will shutdown the current running server if one started successfully and start a new one thus removing the need for a `server:restart` command.

**Note:** If the server fails to start a new attempt will be taken to start the server. If the restart fails five times a restart attempt will not be taken a sixth time.

```bash
# Starts the server in the current directory
horsepower server:start

# Start the server in the specified directory
horsepower server:start /path/to/server/root
```

## Stop Server

Stops an instance of a horsepower server application. When the server is stopped, the `pid` will be removed from the `horsepower.json` file.

```bash
# Stops the server in the current directory
horsepower server:stop

# Stops the server in the specified directory
horsepower server:stop /path/to/server/root
```

## Server Logging

Displays the tail of the server log file at `storage/framework/logs/server.log`. This file will be created upon `server:start`, and truncated upon `server:stop`.

**Note:** Logging will not be logged to this file when in production mode.

```bash
# Shows the server log in the current directory
horsepower server:log

# Shows the server log in the specified directory
horsepower server:log /path/to/server/root
```

## Server List

Displays all the servers that are currently running.

```bash
horsepower server:list
```
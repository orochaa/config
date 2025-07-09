# Development Environment Setup

This repository contains a set of configuration files to standardize and enhance the development environment. Below are the instructions on how to use these files to configure your local setup.

## Terminal Setup

To enhance your terminal experience, this setup uses a combination of tools that provide a powerful and visually appealing command-line interface. Below is a list of the recommended tools and their installation guides.

- **WSL2 (Windows Subsystem for Linux):** A compatibility layer for running Linux binary executables natively on Windows.

  - [Installation Guide](https://learn.microsoft.com/en-us/windows/wsl/install)

- **Zsh:** A powerful shell that operates as an interactive login shell and a command interpreter for shell scripting.

  - [Installation Guide](https://github.com/ohmyzsh/ohmyzsh/wiki/Installing-ZSH)

- **Powerlevel10k:** A theme for Zsh that provides a fast and customizable prompt.

  - [Installation Guide](https://github.com/romkatv/powerlevel10k#installation)

- **Zsh Plugins:**

  - **zsh-autosuggestions:** Suggests commands as you type based on history and completions.
    - [Installation Guide](https://github.com/zsh-users/zsh-autosuggestions/blob/master/INSTALL.md)
  - **zsh-syntax-highlighting:** Provides syntax highlighting for the command line.
    - [Installation Guide](https://github.com/zsh-users/zsh-syntax-highlighting/blob/master/INSTALL.md)

- **fzf:** A command-line fuzzy finder for quickly finding files, commands, and other resources.

  - [Installation Guide](https://github.com/junegunn/fzf#installation)

- **eza:** A modern replacement for the `ls` command with more features and better defaults.

  - [Installation Guide](https://github.com/eza-community/eza/blob/main/INSTALL.md)

- **batcat:** A `cat` clone with syntax highlighting and Git integration.

  - [Installation Guide](https://github.com/sharkdp/bat#installation)

- **zoxide:** A smarter `cd` command that remembers your most used directories.
  - [Installation Guide](https://github.com/ajeetdsouza/zoxide/blob/main/INSTALL.md)

## Visual Studio Code

### Settings

To configure Visual Studio Code, follow these steps:

1.  Open Visual Studio Code.
2.  Press `F1` or `Ctrl+Shift+P` to open the command palette.
3.  Type `Preferences: Open Settings (JSON)` and press `Enter`.
4.  Copy the entire content of the `settings.json` file from this repository and paste it into your `settings.json` file.

### Working with WSL2

To seamlessly work with files inside WSL2 from Visual Studio Code, it is highly recommended to use the **WSL** extension.

1.  Install the [WSL extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) from the VS Code Marketplace.
2.  Once installed, you can open a remote WSL window by running `code .` from your WSL terminal or by using the command palette (`F1` or `Ctrl+Shift+P`) and searching for `WSL: Connect to WSL`.

### Recommended Extensions

Recommended VS Code extensions for a better development experience. To install them, click on the links below or go to the Extensions view (`Ctrl+Shift+X`) and search for each extension by name.

- **Linters & Formatters:**
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
  - [Biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
  - [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)
- **Themes:**
  - [OmniTheme](https://marketplace.visualstudio.com/items?itemName=rocketseat.theme-omni)
  - [Material Icons Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme)
- **Helpers:**
  - [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
  - [vscode-two-slash-queries](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-twoslash-queries)

## Git Configuration

To use the provided Git configuration, you need to update your global `.gitconfig` file.

1.  Open a terminal.
2.  Config vs code as your core editor:
    ```bash
    git config --global core.editor code
    ```
3.  To edit your global Git configuration file, run the following command:
    ```bash
    git config --global --edit
    ```
4.  Copy the content of the `.gitconfig` file from this repository and paste it into your global `.gitconfig` file.

### Git Aliases

The `.gitconfig` file includes a set of useful aliases to streamline your Git workflow:

| Alias   | Command                               | Description                                         |
| :------ | :------------------------------------ | :-------------------------------------------------- |
| `s`     | `git status -s`                       | Show a short status of your repository.             |
| `c`     | `git add --all && git commit -m`      | Stage all changes and commit with a message.        |
| `cm`    | `git commit -m`                       | Commit with a message.                              |
| `a`     | `git commit --amend`                  | Amend the last commit.                              |
| `aa`    | `git add --all && git commit --amend` | Stage all changes and amend the last commit.        |
| `l`     | `git log --pretty=format:'...'`       | Show a formatted log of your commits.               |
| `r`     | `git remote -v`                       | List all your remotes.                              |
| `ra`    | `git remote add`                      | Add a new remote.                                   |
| `rr`    | `git remote rename`                   | Rename a remote.                                    |
| `rd`    | `git remote remove`                   | Remove a remote.                                    |
| `rs`    | `git remote set-url`                  | Change the URL of a remote.                         |
| `b`     | `git branch -v`                       | List all your branches.                             |
| `bd`    | `git branch -D`                       | Delete a branch.                                    |
| `ck`    | `git checkout`                        | Switch to a branch.                                 |
| `po`    | `git push o`                          | Push to the `origin` remote.                        |
| `pd`    | `git push d`                          | Push to the `downstream` remote.                    |
| `pa`    | `git po && git pd`                    | Push to both `origin` and `downstream` remotes.     |
| `pr`    | `git po && git po --tags`             | Push to `origin` and push all tags.                 |
| `sr`    | `git reset --soft HEAD^ && git reset` | Soft reset the last commit and unstage the changes. |
| `g`     | `git config --global --edit`          | Edit the global Git configuration file.             |
| `patch` | `git diff --staged > wip.patch`       | Create a patch file from your staged changes.       |
| `alias` | `git config --get-regexp '^alias'`    | List all your Git aliases.                          |

## Zsh Configuration

The `.zshrc` file contains configurations for the Zsh shell, including aliases, environment variables, and plugins.

1.  Open your `.zshrc` file in a text editor. It is usually located in your home directory (`~/.zshrc`).
2.  Copy the content of the `.zshrc` file from this repository and add it to your own `.zshrc` file.
3.  Restart your terminal or run `source ~/.zshrc` to apply the changes.

### Zsh Aliases

| Alias    | Command                                                                       | Description                                       |
| :------- | :---------------------------------------------------------------------------- | :------------------------------------------------ |
| `zsh`    | `code $HOME/.zshrc`                                                           | Open the `.zshrc` file in VS Code.                |
| `up`     | `source $HOME/.zshrc`                                                         | Reload the `.zshrc` configuration.                |
| `nopoly` | `npx nolyfill install; pnpm install`                                          | Install dependencies using `nolyfill` and `pnpm`. |
| `cls`    | `clear`                                                                       | Clear the terminal screen.                        |
| `cat`    | `batcat --color=always`                                                       | A `cat` clone with syntax highlighting.           |
| `ls`     | `eza --icons=never --color=never --classify=always --group-directories-first` | A modern replacement for `ls`.                    |
| `cd`     | `z`                                                                           | A smarter `cd` command that learns your habits.   |
| `my`     | `my-cli`                                                                      | A custom CLI.                                     |

# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

# Plugins
source ~/.oh-my-zsh/custom/themes/powerlevel10k/powerlevel10k.zsh-theme
source ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
source ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# NVM
export NVM_NO_USE=false
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# PNPM
export PNPM_HOME="/root/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# Golang
export GOPATH=$HOME/go
export PATH=$PATH:/usr/local/go/bin:$GOPATH/bin

# Rust
export PATH=$PATH:$HOME/.cargo/bin

# Zoxide
export PATH=$PATH:/root/.local/bin:/root/.local/bin/zoxide
eval "$(zoxide init zsh)"

# FZF
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
export FZF_DEFAULT_OPTS=" \
  --style default \
  --walker-skip .git,node_modules,dist,coverage \
  --preview 'bat -n --color=always {}' \
  --bind 'ctrl-/:change-preview-window(down|hidden|)'"

# Pulumi
export PATH=$PATH:/root/.pulumi/bin

# SSH
export SSH_AUTH_SOCK="$XDG_RUNTIME_DIR/ssh-agent.socket"

if ssh-add -l >/dev/null 2>&1; then
  :
else
  ssh-add ~/.ssh/id_ed25519_work &>/dev/null
  ssh-add ~/.ssh/id_ed25519_personal &>/dev/null
fi

# Aliases
alias zsh="code $HOME/.zshrc"
alias up="source $HOME/.zshrc"

alias cls="clear"
alias ls="eza --icons=never --color=always --classify=always --group-directories-first"
alias cd="z"
alias xcopy="xclip -sel clipboard"

alias format-db="npx prettier --ignore-path=.gitignore --write /home/unvoid/git/unvoid/when/packages/api/src/database/ && lint /home/unvoid/git/unvoid/when/packages/api/src/database/"
alias format-doc="npx prettier --write --print-width 80 --prose-wrap always"
alias unformat-doc="npx prettier --write --prose-wrap never"
alias lint="npx biome check --write --unsafe"
alias nopoly="npx nolyfill install && pnpm install"

alias ff="fastfetch"

alias fman="compgen -c | fzf | xargs man"
alias tree="tree -L 2 -a -I '.git' --charset X"
alias fls="fd | fzf --multi"
alias gs='gh stack'
alias secret='openssl rand -hex 32'

# Keybindings
# Home
bindkey '^[[H' beginning-of-line
# End
bindkey '^[[F' end-of-line
# Ctrl + Left Arrow
bindkey '^[[1;5D' backward-word
# Ctrl + Right Arrow
bindkey '^[[1;5C' forward-word
# Delete
bindkey '^[[3~' delete-char
# Ctrl + Backspace
bindkey '^H' backward-kill-word
# Ctrl + Delete
bindkey '^[[3;5~' kill-word

# Functions
turboc() {
  if [ "$2" = "std" ]; then
    TURBO_TELEMETRY_DISABLED=1 npx turbo run "$1" --filter="@unvoidweb/$2"
    return
  fi

  TURBO_TELEMETRY_DISABLED=1 npx turbo run "$1" --filter="@lib/$2"
}

pnpmc() {
  pnpm --filter @lib/$2 run $1
}

dev() {
  local project
  project="$(
    {
      fd . "$HOME/git" --min-depth 2 --max-depth 2 --type d
      echo "$HOME/.agents/skills"
    } | fzf --reverse --height=40% --preview 'eza --tree --level 2 --icons=never --color=never --classify=always --group-directories-first --git-ignore {} | head -200'
  )"
  [[ -n "$project" ]] && code "$project"
}

fcp() {
  local source="$1"
  local destination="${2:-$PWD}"

  (
    cd "$source" || return 1

    fd --hidden --exclude .git --print0 |
      fzf \
        --multi \
        --read0 \
        --print0 \
        --preview '
          if [[ -d {} ]]; then
            eza --tree --level 2 --icons=never --color=always --group-directories-first {}
          else
            bat -n --color=always {}
          fi
        ' |
      rsync -a --recursive --from0 --files-from=- ./ "$destination/"
  )
}

killport() {
  if [[ -z "$1" ]]; then
    echo "Usage: killport <port>"
    return 1
  fi

  local port="$1"
  local pids=("${(@f)$(lsof -ti TCP:"$port" -sTCP:LISTEN)}")

  if (( ${#pids} == 0 )); then
    echo "No process listening on port $port"
    return 1
  fi

  kill -9 "${pids[@]}"
  echo "Killed process(es) on port $port: ${pids[*]}"
}

# Playwright Fedora wrapper (https://github.com/CybLow/playwright-fedora)
if [ -f "$HOME/.local/share/playwright-fedora/pw.bash" ]; then
    source "$HOME/.local/share/playwright-fedora/pw.bash"
fi

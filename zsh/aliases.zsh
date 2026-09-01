# Add your shell aliases here.
alias reload='exec $SHELL -l'

# Flatten newlines out of whatever's on the clipboard, then put it back.
# For when a wrapped command or path gets copied with a hard line break in it.
alias unwrap="pbpaste | perl -0777 -pe 's/\n\s*//g' | pbcopy"

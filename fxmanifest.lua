name 'mb-emotes'
author 'MisterBuzzee'
version '0.1.0'
license 'GPL-3.0-only'
description 'Custom emotes with admin-panel-style UI'
repository 'https://github.com/MisterBuzzee/mb-emotes'
fx_version 'cerulean'
game 'gta5'
node_version '22'

client_script 'dist/client.js'
ui_page 'web/index.html'

dependencies {
	'ai-core',
}

files {
	'locales/*.json',
	'data/emotes.json',
	'web/index.html',
	'stream/**',
}
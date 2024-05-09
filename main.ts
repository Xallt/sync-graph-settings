import { Plugin, WorkspaceLeaf, normalizePath, PluginSettingTab , Setting} from 'obsidian';

interface SyncGraphPluginSettings {
	defaultDepth: number;
}

const DEFAULT_SETTINGS: SyncGraphPluginSettings = {
	defaultDepth: 1
}

export class SyncGraphSettingTab extends PluginSettingTab {
  plugin: SyncGraphPlugin;

  constructor(app: App, plugin: SyncGraphPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Default depth")
      .addText((text) =>
        text
          .setPlaceholder("1")
          .setValue((this.plugin.settings.defaultDepth || 1).toString())
          .onChange(async (value) => {
            this.plugin.settings.defaultDepth = Number.parseInt(value) || 1;
            await this.plugin.saveSettings();
          })
      );
  }
}


export default class SyncGraphPlugin extends Plugin {
	settings: SyncGraphPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SyncGraphSettingTab(this.app, this));

		this.addCommand({
			id: "sync-graph-settings-to-localgraph",
			name: "Sync Graph Settings to Local Graph",
			callback: async () => { await this.syncGlobalToLocal() }
		})
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async syncGlobalToLocal() {
		const configDir = this.app.vault.configDir;
		const graphConfigPath = normalizePath(configDir + '/graph.json');

		// this.app.vault.getAbstractFileByPath('.obsidian/graph.json') would return null
		// So we're doing it the less safe way
		const graphConfigJson = await this.app.vault.adapter.read(graphConfigPath);
		const graphConfig = JSON.parse(graphConfigJson);
		const graphColorGroups = graphConfig.colorGroups;
		const searchFilters = graphConfig.search;
		this.getLocalGraphLeaves().forEach((leaf) => {
			this.setSettings(leaf, graphColorGroups, searchFilters);
		})
	}

	getLocalGraphLeaves() {
		return this.app.workspace.getLeavesOfType('localgraph');
	}
	
	setSettings(localGraphLeaf: WorkspaceLeaf, colorGroups: any, searchFilters: any) {
		const viewState = localGraphLeaf.getViewState();
		viewState.state.options.colorGroups = colorGroups;
		viewState.state.options.search = searchFilters;
		viewState.state.options.localJumps = this.settings.defaultDepth;
		localGraphLeaf.setViewState(viewState);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

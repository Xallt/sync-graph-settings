import { Plugin, WorkspaceLeaf, normalizePath, PluginSettingTab, Setting, App } from 'obsidian';

interface SyncGraphPluginSettings {
	autoSync: boolean;
	defaultDepth: number;
	defaultIncomingLinks: boolean;
	defaultOutgoingLinks: boolean;
	defaultNeighborLinks: boolean;
}

const DEFAULT_SETTINGS: SyncGraphPluginSettings = {
	autoSync: false,
	defaultDepth: 1,
	defaultIncomingLinks: true,
	defaultOutgoingLinks: true,
	defaultNeighborLinks: true
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
			.setName("Auto Sync")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoSync)
					.onChange(async (value) => {
						this.plugin.settings.autoSync = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default depth").addSlider((value) =>
				value
					.setLimits(1, 5, 1)
					.setValue(this.plugin.settings.defaultDepth)
					.onChange(async (value) => {
						this.plugin.settings.defaultDepth = value;
						await this.plugin.saveSettings();
					})
					.setDynamicTooltip()
			);
		new Setting(containerEl)
			.setName("Default Incoming Links")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.defaultIncomingLinks)
					.onChange(async (value) => {
						this.plugin.settings.defaultIncomingLinks = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Default Outgoing Links")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.defaultOutgoingLinks)
					.onChange(async (value) => {
						this.plugin.settings.defaultOutgoingLinks = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Default Neighbor Links")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.defaultNeighborLinks)
					.onChange(async (value) => {
						this.plugin.settings.defaultNeighborLinks = value;
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

		this.app.workspace.on('active-leaf-change', async () => {
			if (this.settings.autoSync) {
				await this.syncGlobalToLocal();
			}
		}
		);
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
		const closeSettings = graphConfig.close;
		const lineSizeMultiplier = graphConfig.lineSizeMultiplier;
		const nodeSizeMultiplier = graphConfig.nodeSizeMultiplier;
		this.getLocalGraphLeaves().forEach((leaf) => {
			this.setSettings(leaf, graphColorGroups, searchFilters, closeSettings, lineSizeMultiplier, nodeSizeMultiplier);
		})
	}

	getLocalGraphLeaves() {
		return this.app.workspace.getLeavesOfType('localgraph');
	}

	setSettings(localGraphLeaf: WorkspaceLeaf, colorGroups: any, searchFilters: any, closeSettings: any, lineSizeMultiplier: any, nodeSizeMultiplier: any) {
		const viewState = localGraphLeaf.getViewState();
		viewState.state.options.colorGroups = colorGroups;
		viewState.state.options.search = searchFilters;
		viewState.state.options.close = closeSettings;
		viewState.state.options.lineSizeMultiplier = lineSizeMultiplier;
		viewState.state.options.nodeSizeMultiplier = nodeSizeMultiplier;

		viewState.state.options.localJumps = this.settings.defaultDepth;
		viewState.state.options.localBacklinks = this.settings.defaultIncomingLinks;
		viewState.state.options.localForelinks = this.settings.defaultOutgoingLinks;
		viewState.state.options.localInterlinks = this.settings.defaultNeighborLinks;
		localGraphLeaf.setViewState(viewState);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// Sonde de compatibilité pour Weebox — phase B.
// But : prouver que le dépôt est reconnu, l'extension installée et le code exécuté.
// Contraintes : aucun appel réseau, aucun accès fichier, aucune source vidéo.
// Le moteur exige une classe globale nommée exactement `Provider`.

class Provider {
  getSettings() {
    return {
      episodeServers: ["probe"],
      supportsDub: false,
    };
  }

  async search(_opts) {
    return [
      {
        id: "probe-1",
        title: "Hello Weebox (probe)",
        url: "",
        subOrDub: "sub",
      },
    ];
  }

  async findEpisodes(_id) {
    return [
      {
        id: "probe-ep-1",
        number: 1,
        title: "Épisode sonde",
        url: "",
      },
    ];
  }

  async findEpisodeServer(_episode, _server) {
    // Aucune source vidéo : par construction, rien ne peut être lu.
    return {
      server: "probe",
      headers: {},
      videoSources: [],
    };
  }
}

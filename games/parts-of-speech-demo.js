(function () {
  "use strict";

  const repairPrompt = "Какой вопрос задаётся к слову?";
  const grammar = {
    noun: ["что?", "существительное"],
    adjective: ["какой?", "прилагательное"],
    adverb: ["как?", "наречие"],
    imperfectiveVerb: ["что делать?", "глагол несовершенного вида"],
    perfectiveVerb: ["что сделать?", "глагол совершенного вида"],
    presentActiveParticiple: ["что делающий?", "действительное причастие настоящего времени"],
    presentPassiveParticiple: ["делаемый?", "страдательное причастие настоящего времени"],
    pastActiveParticiple: ["что (с)делавший?", "действительное причастие прошедшего времени"],
    pastPassiveParticiple: ["(с)деланный?", "страдательное причастие прошедшего времени"],
    imperfectiveGerund: ["что делая?", "деепричастие несовершенного вида"],
    perfectiveGerund: ["что сделав?", "деепричастие совершенного вида"]
  };

  function capsule(text, type, correct, answerOverride) {
    const [defaultAnswer, partOfSpeech] = grammar[type];
    const repairAnswer = answerOverride || defaultAnswer;
    return {
      text,
      correct,
      repairPrompt,
      repairAnswer,
      repairResult: `${repairAnswer} → ${partOfSpeech}`
    };
  }

  const c = capsule;
  window.GAME_CONFIG = {
    id: "parts-of-speech-v1",
    title: "Космический пылесос",
    subtitle: "Части речи",
    speed: 0.72,
    burstPauseMs: 1200,
    settings: { captureRadius: 150, autoNextGroup: true, minCorrectTargets: 2 },
    groups: [
      { id: "igra", prompt: "Лови деепричастия", items: [
        c("игра", "noun", false), c("игровой", "adjective", false), c("игриво", "adverb", false),
        c("играть", "imperfectiveVerb", false), c("играющий", "presentActiveParticiple", false),
        c("сыгравший", "pastActiveParticiple", false), c("играя", "imperfectiveGerund", true),
        c("сыграв", "perfectiveGerund", true), c("разыгравшись", "perfectiveGerund", true),
        c("играемый", "presentPassiveParticiple", false)
      ] },
      { id: "shum", prompt: "Лови причастия", items: [
        c("шум", "noun", false), c("шумный", "adjective", false), c("шумно", "adverb", false),
        c("шуметь", "imperfectiveVerb", false), c("шумящий", "presentActiveParticiple", true),
        c("зашумевший", "pastActiveParticiple", true), c("пошумевший", "pastActiveParticiple", true),
        c("шумя", "imperfectiveGerund", false), c("пошумев", "perfectiveGerund", false)
      ] },
      { id: "skolzhenie", prompt: "Лови деепричастия", items: [
        c("скольжение", "noun", false), c("скользкий", "adjective", false), c("скользко", "adverb", false),
        c("скользить", "imperfectiveVerb", false), c("скользящий", "presentActiveParticiple", false),
        c("поскользнувшийся", "pastActiveParticiple", false), c("скользя", "imperfectiveGerund", true),
        c("поскользнувшись", "perfectiveGerund", true)
      ] },
      { id: "trevoga", prompt: "Лови причастия", items: [
        c("тревога", "noun", false), c("тревожный", "adjective", false), c("тревожно", "adverb", false),
        c("тревожить", "imperfectiveVerb", false), c("тревожащий", "presentActiveParticiple", true),
        c("встревоженный", "pastPassiveParticiple", true), c("тревожа", "imperfectiveGerund", false),
        c("встревожившись", "perfectiveGerund", false)
      ] },
      { id: "tochnost", prompt: "Лови наречия", items: [
        c("точность", "noun", false), c("точный", "adjective", false), c("неточный", "adjective", false),
        c("точно", "adverb", true), c("неточно", "adverb", true), c("уточнить", "perfectiveVerb", false),
        c("уточняющий", "presentActiveParticiple", false), c("уточнённый", "pastPassiveParticiple", false),
        c("уточняя", "imperfectiveGerund", false)
      ] },
      { id: "yasnost", prompt: "Лови наречия", items: [
        c("ясность", "noun", false), c("ясный", "adjective", false), c("неясный", "adjective", false),
        c("ясно", "adverb", true), c("неясно", "adverb", true), c("прояснить", "perfectiveVerb", false),
        c("проясняющий", "presentActiveParticiple", false), c("прояснённый", "pastPassiveParticiple", false),
        c("проясняя", "imperfectiveGerund", false)
      ] },
      { id: "radost", prompt: "Лови деепричастия", items: [
        c("радость", "noun", false), c("радостный", "adjective", false), c("радостно", "adverb", false),
        c("радовать", "imperfectiveVerb", false), c("радующий", "presentActiveParticiple", false),
        c("обрадованный", "pastPassiveParticiple", false), c("радуя", "imperfectiveGerund", true),
        c("обрадовавшись", "perfectiveGerund", true)
      ] },
      { id: "svet", prompt: "Лови причастия", items: [
        c("свет", "noun", false), c("светлый", "adjective", false), c("светло", "adverb", false),
        c("светить", "imperfectiveVerb", false), c("светящийся", "presentActiveParticiple", true),
        c("осветивший", "pastActiveParticiple", true), c("освещённый", "pastPassiveParticiple", true),
        c("светя", "imperfectiveGerund", false), c("осветив", "perfectiveGerund", false)
      ] },
      { id: "spokoystvie", prompt: "Лови прилагательные", items: [
        c("спокойствие", "noun", false), c("спокойный", "adjective", true), c("неспокойный", "adjective", true),
        c("спокойно", "adverb", false), c("неспокойно", "adverb", false), c("успокоить", "perfectiveVerb", false),
        c("успокаивающий", "presentActiveParticiple", false), c("успокоенный", "pastPassiveParticiple", false),
        c("успокаивая", "imperfectiveGerund", false),
        c("успокаиваемый", "presentPassiveParticiple", false, "что делаемый?"),
        c("успокоивший", "pastActiveParticiple", false), c("успокоив", "perfectiveGerund", false),
        c("успокоение", "noun", false)
      ] },
      { id: "spokoystvie-participles", prompt: "Лови причастия", items: [
        c("спокойствие", "noun", false), c("спокойный", "adjective", false), c("неспокойный", "adjective", false),
        c("спокойно", "adverb", false), c("неспокойно", "adverb", false), c("успокоить", "perfectiveVerb", false),
        c("успокаивающий", "presentActiveParticiple", true), c("успокоенный", "pastPassiveParticiple", true),
        c("успокаивая", "imperfectiveGerund", false),
        c("успокаиваемый", "presentPassiveParticiple", true, "что делаемый?"),
        c("успокоивший", "pastActiveParticiple", true), c("успокоив", "perfectiveGerund", false),
        c("успокоение", "noun", false)
      ] },
      { id: "grust", prompt: "Лови деепричастия", items: [
        c("грусть", "noun", false), c("грустный", "adjective", false), c("грустно", "adverb", false),
        c("грустить", "imperfectiveVerb", false), c("грустящий", "presentActiveParticiple", false),
        c("загрустивший", "pastActiveParticiple", false), c("грустя", "imperfectiveGerund", true),
        c("погрустив", "perfectiveGerund", true), c("загрустив", "perfectiveGerund", true)
      ] }
    ]
  };
})();

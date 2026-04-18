// GlouGlou! - Données des 65 cases
// Catégories :
//   drink   -> boire
//   give    -> donner / prendre des gorgées
//   role    -> rôle permanent (Roi, Reine, Valet)
//   action  -> action / mini-jeu
//   water   -> pause / eau
//   special -> mouvement, téléportation, etc.
//   party   -> tout le monde boit
//   target  -> vise une catégorie (banane / pêche / dessous)
//   card    -> pioche une carte

window.CASES = [
  // 0 = départ (non joué)
  { n: 0,  title: "Départ",                       cat: "start",   icon: "🏁", short: "Let's glouglou", desc: "Le périple commence. Lance le dé pour partir." },

  { n: 1,  title: "Lance et bois",                cat: "drink",   icon: "🎲", short: "Bois le montant du dé", desc: "Relance un dé et bois le nombre de gorgées indiqué." },
  { n: 2,  title: "Joker",                        cat: "special", icon: "🃏", short: "Un joker gardé pour plus tard", desc: "Tu gagnes un joker utilisable à tout moment pour esquiver un effet." },
  { n: 3,  title: "Le Feu",                       cat: "give",    icon: "🔥", short: "Choisis qui prend ta moitié", desc: "Tu dois boire 6 gorgées. Choisis un autre joueur : il en boit 3 (la moitié). Tu bois les 3 restantes." },
  { n: 4,  title: "Cupidon",                      cat: "action",  icon: "💘", short: "Lie-toi à un autre joueur", desc: "Choisis un joueur. Jusqu'à la fin de la partie, quand l'un boit, l'autre boit aussi." },
  { n: 5,  title: "Tournée générale",             cat: "party",   icon: "🍻", short: "Tout le monde boit 2", desc: "Santé ! Tout le monde autour de la table boit 2 gorgées." },
  { n: 6,  title: "Shot",                         cat: "drink",   icon: "🥃", short: "Cul sec d'un shot", desc: "Prends un shot. Pas de discussion." },
  { n: 7,  title: "Donne 5",                      cat: "give",    icon: "👉", short: "Distribue 5 gorgées", desc: "Répartis 5 gorgées entre les autres joueurs comme tu veux." },
  { n: 8,  title: "Prends 5",                     cat: "give",    icon: "👈", short: "Bois 5 gorgées", desc: "Tu prends 5 gorgées dans la tronche." },
  { n: 9,  title: "Purple 3 tours",               cat: "action",  icon: "💜", short: "Lève le pouce 3 tours", desc: "Pendant 3 tours, tu dois lever le pouce avant de boire. Sinon, 3 gorgées." },
  { n: 10, title: "C'est un 10 mais…",            cat: "action",  icon: "🔟", short: "Compte à rebours", desc: "À toi d'inventer une règle idiote sur le chiffre 10. Ou bois 10." },
  { n: 11, title: "11 pompes",                    cat: "action",  icon: "💪", short: "11 pompes ou bois 11", desc: "Fais 11 pompes maintenant. Sinon, bois 11 gorgées." },
  { n: 12, title: "Pioche une carte",             cat: "card",    icon: "🃏", short: "La carte décide de ton sort", desc: "Pioche une carte au hasard. La valeur détermine ton destin." },
  { n: 13, title: "Cul sec",                      cat: "drink",   icon: "🍺", short: "Finis ton verre", desc: "Cul sec. Termine ce que tu as en main." },
  { n: 14, title: "Valentine",                    cat: "action",  icon: "📞", short: "Appelle ton ex", desc: "Décroche ton téléphone et appelle un ex. Sinon, 5 gorgées." },
  { n: 15, title: "Donne 5",                      cat: "give",    icon: "👉", short: "Distribue 5 gorgées", desc: "Répartis 5 gorgées entre les autres." },
  { n: 16, title: "Prends 6",                     cat: "give",    icon: "👈", short: "Bois 6 gorgées", desc: "Cadeau. Tu prends 6 gorgées." },
  { n: 17, title: "Cascade basse",                cat: "target",  icon: "⬇️", short: "Tous ceux derrière boivent", desc: "Tous les joueurs situés derrière toi sur le plateau boivent 2 gorgées." },
  { n: 18, title: "Action ou Vérité",             cat: "action",  icon: "🎭", short: "Choisis ton camp", desc: "Action ou vérité ? Le groupe choisit la question. Refuser = 5 gorgées." },
  { n: 19, title: "Les garçons boivent",          cat: "target",  icon: "🍌", short: "Banana time", desc: "Tous les joueurs marqués banane boivent 2 gorgées." },
  { n: 20, title: "J'ai jamais / J'ai déjà",      cat: "action",  icon: "🙈", short: "Confessions obligatoires", desc: "Dis une phrase en 'j'ai déjà'. Ceux qui l'ont fait aussi boivent." },
  { n: 21, title: "Shot",                         cat: "drink",   icon: "🥃", short: "Cul sec d'un shot", desc: "Un deuxième shot, parce que tu le mérites." },
  { n: 22, title: "10 tours sur toi-même",        cat: "action",  icon: "🌀", short: "Vertige garanti", desc: "Lève-toi, 10 tours sur toi-même. Si tu tombes, 3 gorgées." },
  { n: 23, title: "Tout le monde prend 2",        cat: "party",   icon: "🍻", short: "Santé collective", desc: "Tout le monde boit 2 gorgées." },
  { n: 24, title: "Roi des questions",            cat: "role",    icon: "👑", short: "Règne par la curiosité", desc: "Dès que tu poses une question, ceux qui répondent boivent. Si on répond « Ta gueule ! », c'est TOI qui bois." },
  { n: 25, title: "Reine des p***s",              cat: "role",    icon: "👸", short: "Regarde-la pas dans les yeux", desc: "Personne ne doit croiser ton regard. Celui qui te regarde boit 2 gorgées." },
  { n: 26, title: "Valet des pouces",             cat: "role",    icon: "👍", short: "Pouce sur la table", desc: "Quand tu poses le pouce sur la table, tout le monde t'imite. Le dernier boit." },
  { n: 27, title: "Pioche une carte",             cat: "card",    icon: "🃏", short: "La carte décide de ton sort", desc: "Pioche une carte au hasard. La valeur détermine ton destin." },
  { n: 28, title: "Purple 4 tours",               cat: "action",  icon: "💜", short: "Pouce levé 4 tours", desc: "Pendant 4 tours, lève le pouce avant de boire. Sinon 3 gorgées." },
  { n: 29, title: "Les filles boivent",           cat: "target",  icon: "🍑", short: "Peach party", desc: "Tous les joueurs marqués pêche boivent 2 gorgées." },
  { n: 30, title: "Donne 5",                      cat: "give",    icon: "👉", short: "Distribue 5 gorgées", desc: "Répartis 5 gorgées entre les autres joueurs." },
  { n: 31, title: "Bois 5",                       cat: "give",    icon: "👈", short: "Bois 5 gorgées", desc: "Tu prends 5 gorgées." },
  { n: 32, title: "Dos à dos",                    cat: "action",  icon: "🔙", short: "Qui de vous deux ?", desc: "Avec un autre joueur dos à dos. On vous pose une question 'qui de vous deux' — si désaccord, les deux boivent." },
  { n: 33, title: "Shot",                         cat: "drink",   icon: "🥃", short: "Cul sec d'un shot", desc: "Un shot. Tu connais le rituel." },
  { n: 34, title: "10 tours",                     cat: "action",  icon: "🌀", short: "Tourne tourne tourne", desc: "10 tours sur toi-même. Si tu tombes, 3 gorgées." },
  { n: 35, title: "Cascade basse",                cat: "target",  icon: "⬇️", short: "Tous ceux derrière boivent", desc: "Tous les joueurs derrière toi boivent 2 gorgées." },
  { n: 36, title: "Vérité ou Vérité",             cat: "action",  icon: "🔍", short: "Le groupe juge", desc: "Tu réponds à une question. Le groupe vote : s'il pense que tu as menti, tu bois 5." },
  { n: 37, title: "Pinte du Roi",                 cat: "drink",   icon: "🍺", short: "Une pinte d'un coup", desc: "Finis une pinte entière. Ou partage avec un voisin courageux." },
  { n: 38, title: "Bois le dé",                   cat: "drink",   icon: "🎲", short: "Bois le montant du dé", desc: "Relance un dé et bois le nombre indiqué." },
  { n: 39, title: "Retour case 33",               cat: "special", icon: "↩️", short: "Reviens au shot", desc: "Retourne à la case 33 et applique son effet. Oui, encore un shot." },
  { n: 40, title: "Reine des p***s",              cat: "role",    icon: "👸", short: "Baisse les yeux", desc: "Personne ne doit te regarder dans les yeux. Celui qui croise ton regard boit 2." },
  { n: 41, title: "Valet des pouces",             cat: "role",    icon: "👍", short: "Pouce sur la table", desc: "Pouce sur la table — tout le monde t'imite. Le dernier boit." },
  { n: 42, title: "Roi des questions",            cat: "role",    icon: "👑", short: "Règne par la curiosité", desc: "Ceux qui répondent à tes questions boivent. Si on dit « Ta gueule ! », tu bois." },
  { n: 43, title: "Bois 5",                       cat: "give",    icon: "👈", short: "Bois 5 gorgées", desc: "Tu prends 5 gorgées." },
  { n: 44, title: "Les garçons boivent 3",        cat: "target",  icon: "🍌", short: "Banana time", desc: "Tous les joueurs marqués banane boivent 3 gorgées." },
  { n: 45, title: "Shot",                         cat: "drink",   icon: "🥃", short: "Cul sec", desc: "Encore un shot. On ne compte plus." },
  { n: 46, title: "Les filles boivent 3",         cat: "target",  icon: "🍑", short: "Peach party", desc: "Tous les joueurs marqués pêche boivent 3 gorgées." },
  { n: 47, title: "Pioche une carte",             cat: "card",    icon: "🃏", short: "La carte décide de ton sort", desc: "Pioche une carte. Valeur basse = gorgées, figure = rôle, As = shot !" },
  { n: 48, title: "10 tours sur toi",             cat: "action",  icon: "🌀", short: "Encore", desc: "10 tours sur toi-même. Oui, encore une fois." },
  { n: 49, title: "Prend 5",                      cat: "drink",   icon: "👈", short: "Bois 5 gorgées", desc: "Tu prends 5 gorgées dans la tronche. Pas de négociation." },
  { n: 50, title: "Recule de 1",                  cat: "special", icon: "⏪", short: "-1 case + effet", desc: "Recule d'une case et applique son effet." },
  { n: 51, title: "Purple x3",                    cat: "action",  icon: "💜", short: "Jusqu'à 3 pouces", desc: "Tu dois lever le pouce avant chaque gorgée jusqu'à l'avoir fait 3 fois. Sinon 3 gorgées à chaque oubli." },
  { n: 52, title: "Pioche une carte",             cat: "card",    icon: "🃏", short: "La carte décide de ton sort", desc: "Pioche une carte. La table retient son souffle." },
  { n: 53, title: "Recule de 3",                  cat: "special", icon: "⏪", short: "-3 cases + effet en chaîne", desc: "Recule de 3 cases. Si c'est une case de recul, recule encore et applique le dernier effet atteint." },
  { n: 54, title: "Action ou Vérité",             cat: "action",  icon: "🎭", short: "Julie vote", desc: "Action ou vérité. Le groupe vote si c'est validé ou pas." },
  { n: 55, title: "Pinte du Roi",                 cat: "drink",   icon: "🍺", short: "Une pinte entière", desc: "Deuxième Pinte du Roi. Finis une pinte entière, ou partage avec un volontaire courageux." },
  { n: 56, title: "Téléportation descendante",    cat: "special", icon: "🌀", short: "Case random avant toi", desc: "Tu te téléportes à une case aléatoire située AVANT celle-ci, et tu appliques son effet." },
  { n: 57, title: "Téléporte un joueur",          cat: "special", icon: "✨", short: "Choisis une victime", desc: "Choisis un autre joueur : il se téléporte à une case aléatoire (autre que celle-ci) et applique l'effet." },
  { n: 58, title: "2 shots",                      cat: "drink",   icon: "🥃", short: "Double peine", desc: "Deux shots cul sec. Ton foie pleure." },
  { n: 59, title: "Cul sec",                      cat: "drink",   icon: "🍺", short: "Finis ton verre", desc: "Termine ton verre d'un coup." },
  { n: 60, title: "L'Avant-Dernière",             cat: "drink",   icon: "🥃", short: "Shot + bois 3", desc: "Presque là. Tu prends un shot ET 3 gorgées. La ligne d'arrivée est toute proche." },
  { n: 61, title: "Jet inversé",                  cat: "special", icon: "↩️", short: "Ton prochain jet te fait reculer", desc: "Attention ! Ton prochain lancer de dé te fera reculer au lieu d'avancer. Prépare-toi." },
  { n: 62, title: "Pinte du Roi",                 cat: "drink",   icon: "🍺", short: "Troisième pinte du roi", desc: "La dernière ligne droite commence fort. Finis une pinte entière ou partage-la." },
  { n: 63, title: "Pioche une carte",             cat: "card",    icon: "🃏", short: "Dernière carte avant la fin", desc: "Une dernière pioche avant l'arrivée. Tout peut arriver." },
  { n: 64, title: "Tempête",                      cat: "party",   icon: "⛈️", short: "Tout le monde boit 3", desc: "Tempête finale ! Tout le monde autour de la table boit 3 gorgées. Personne n'est épargné." },
  { n: 65, title: "Arrivée",                      cat: "finish",  icon: "🏆", short: "GlouGlou Champion", desc: "Tu as survécu aux 65 cases. Tout le monde te fait un toast, et toi tu bois cul sec une dernière fois." },
];

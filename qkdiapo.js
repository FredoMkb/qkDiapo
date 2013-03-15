/* -------------------------------------------------------------------------------- *\
	Projet :		qkDiapo
	Version :		0402 (03-2013)
	Role : 			Petit script de diaporama avec jQuery - Little slideshow script with jQuery
	Auteur :		FredoMkb (c) 2013 (http://fredomkb.free.fr/)
	License :		Projet libre et open-source - Free and open-source project
\* -------------------------------------------------------------------------------- */

// Plug-in jQuery
(function($)
{ 
	// Variable pour savoir le nombre de diaporamas actifs dans la page
	var nQkd = 0;
	
	// Plug-in qkDiapo
	$.fn.qkdiapo = function(oOptions)
	{
		// On augmente le compteur
		nQkd++;
		
		// Point, dièse et retour
		var sP = '.';
		var sD = '#';
		var sR = "\n";
		
		// Paramètres par defaut
		var oDefauts = {
			slide_tag: '*', // Les objets Html à utiliser pour le diaporama
			fade_time: 600, // La duree de transition d'affichage entre les diapos (1000 = 1 seconde)
			show_time: 4000, // La duree d'affichage normale de chaque diapo (1000 = 1 seconde)
			add_time: 6000, // La duree d'affichage a ajouter si class 'sAdd' presente (1000 = 1 seconde)
			add_class: 'add', // Class a tester sa presence pour ajouter une duree d'affichage
			sort_random: true, // Faut-il trier les diapos dans un ordre aléatoire ?
			nav_auto: true, // Faut-il activer la navigation automatiquement du diaporama ?
			nav_keys: true, // Faut-il activer la navigation avec les touches flêchées du clavier ? (pour la première diapo uniquement)
			nav_inner: true, // Faut-il activer la navigation manuelle à l'intérieur du bloc principal ?
			nav_outer: true, // Faut-il afficher le bloc de navigation extérieur du bloc principal ?
			z: 0
		};
		
		// On fusionne les valeurs par défaut avec les parametres utilisateur
		var oParams = $.extend(oDefauts, oOptions); 

		// On lance le plugin sur chaque objet Html existant
		return this.each(function(nItm)
		{
			// Resource de temporisation
			var rTemp = null;
			
			// Objet Html cible principale
			var oThis = $(this);

			// Configuration par défaut : toutes les données de travail sont issues de cet objet
			var oCfg = {
				// Les objets Html
				oObj: oThis, // Objet Html cible principale
				oSrc: oThis.find('> '+oParams.slide_tag), // Les objets Html au premier niveau de la cible principale
				oNav: null, // L'objet contenant la navigation
				oPrv: null, // L'objet de la navigation précédente
				oNxt: null, // L'objet de la navigation suivante
				oInf: null, // L'objet du texte d'info (compteur de navigation)
				
				// Les classes Html (utilisées pour le ciblage jQuery et dans la feille de style Css)
				sObj: 'qkdiapo', // Classe de l'objet Html cible principale
				sNav: 'qkdiapo_nav', // La class de l'objet contenant la navigation
				sPrv: 'qkdiapo_prv', // La class de la navigation précédente
				sNxt: 'qkdiapo_nxt', // La class de la navigation suivante
				sInf: 'qkdiapo_inf', // La class du texte d'info (compteur de navigation)
				
				// Les données de travail
				nSrc: oThis.find('> '+oParams.slide_tag).length, // Le nombre d'objets Html sources du diaporama
				nNro: 0, // Le numero de l'objet à afficher (le premier élément porte le numéro 0 zéro)
				nItr: 1, // L'itération de navigation (1 = suivant ; -1 = précédent)
				bTmp: true, // Faut-il reprendre l'animation ?
				
				// Les paramètres utilisateur (avec tests pour éviter des valeurs trop petites)
				nFde: (oParams.fade_time < 200) ? 200 : oParams.fade_time,
				nShw: (oParams.show_time < 1000) ? 1000 : oParams.show_time,
				nAdd: (oParams.add_time < 1000) ? 1000 : oParams.add_time,
				sAdd: oParams.add_class,
				bRnd: oParams.sort_random,
				
				// Navigation : il faut s'assurer qu'il y ait au moins un moyen pour afficher les dipaos
				// Si aucune navigation demandée, alors on active l'affichage auto
				bOto: (!oParams.nav_keys && !oParams.nav_inner && !oParams.nav_outer) ? true : oParams.nav_auto,
				// Si affichage auto et navigation internet et externe désactivés, alors on active la navigation au clavier
				bKey: (!oParams.nav_auto && !oParams.nav_inner && !oParams.nav_outer) ? true : oParams.nav_keys,
				// Si affichage auto et navigation clavier et externe désactivés, alors on active la navigation interne
				bInn: (!oParams.nav_auto && !oParams.nav_keys && !oParams.nav_outer) ? true : oParams.nav_inner,
				// Si affichage auto et navigation clavier et interne désactivés, alors on active la navigation externe
				bOut: (!oParams.nav_auto && !oParams.nav_keys && !oParams.nav_inner) ? true : oParams.nav_outer,
				
				// Les styles Css
				oCss: {
					oObj: {
						'position': 'relative',
						'overflow': 'hidden'
					},
					oSrc: {
						'top': 0,
						'left': 0,
						'position': 'absolute',
						'overflow': 'auto'
					}
				},
				
				// Fin
				z: 0
			};
			
			// On ajoute la classe par défaut à l'objet principal
			oCfg.oObj.addClass(oCfg.sObj);
			
			// Si la source contient moins de deux objets, alors on stop le script
			if (oCfg.nSrc < 2) { return false; }

			// On règle les styles Css de l'objet principal
			oCfg.oObj.css(oCfg.oCss.oObj);
			
			// Si la navigation extérieure est demandée, alors 
			// on ajoute son code Html et on met à jour le compteur de navigation
			if (oCfg.bOut) { 
				qkdiapo_nav();
				oCfg.oInf.text((oCfg.nNro + 1)+'/'+oCfg.nSrc);
			}

			// On initialise les fonctions de gestion des événements
			qkdiapo_events();
			
			// Doit-on afficher les diapos en ordre aléatoire ?
			if (oCfg.bRnd) { oCfg.oSrc = qkdiapo_random(oCfg.oSrc); }

			// La durée de temporisation
			var nSee = oCfg.nShw;

			// Faut-il ajouter du temps ?
			if (oCfg.oSrc.eq(0).hasClass(oCfg.sAdd)) { nSee = oCfg.nShw + oCfg.nAdd; }
			
			// On règle les styles Css de toutes les diapos
			oCfg.oSrc.css(oCfg.oCss.oSrc);
			
			// On masque tous les objets sources
			oCfg.oSrc.hide(0);

			// On affiche seulement le premier objet source
			oCfg.oSrc.eq(0).show(0);

			// Premier lancement du diaporama
			if (oCfg.bOto) { rTemp = setTimeout(qkdiapo_show, nSee); }
              

			// Fonction recursive pour executer le diaporama
			function qkdiapo_show() {
				// Bloc actuel
				var oNow = $(oCfg.oSrc).eq(oCfg.nNro);

				// Numéro de la diapo a afficher sélon la navigation croissante ou pas
				oCfg.nNro += oCfg.nItr;

				// Si le numéro de la diapo est supérieur au total des diapos, alors on revient à la première (zéro)
				if (oCfg.nNro > (oCfg.nSrc - 1)) { oCfg.nNro = 0; }

				// Si le numéro de la diapo est inférieur à 0 zéro, alors on prend la dernière
				if (oCfg.nNro < 0) { oCfg.nNro = (oCfg.nSrc - 1); }

				// Nouveau bloc (précédent ou suivant)
				var oNew = $(oCfg.oSrc).eq(oCfg.nNro);

				// On retablie la navigation croissante
				oCfg.nItr = 1;

				// La durée de temporisation
				var nSee = oCfg.nShw;

				// Faut-il ajouter du temps ?
				if (oNew.hasClass(oCfg.sAdd)) { nSee = oCfg.nShw + oCfg.nAdd; }

				// On masque le bloc actuel
				oNow.fadeOut(oCfg.nFde);

				// On affiche le nouveau bloc
				oNew.fadeIn(oCfg.nFde);
				
				// On met à jour le compteur si la navigation est demandée
				if (oCfg.bOut) { oCfg.oInf.text((oCfg.nNro + 1)+'/'+oCfg.nSrc); }

				// Lancement recursif du diaporama
				if ((oCfg.bTmp) && (oCfg.bOto)) { rTemp = setTimeout(qkdiapo_show, nSee); }
			}
			
			// Tri aleatoire
			function qkdiapo_random(aO) {
				// http://stackoverflow.com/questions/962802/is-it-correct-to-use-javascript-array-sort-method-for-shuffling
				// aO = tableau original
				// sT = valeur temporaire
				// nC = index courant
				// nN = nombre éléments
				// Boucle descendente, on remplace le dernier élément par un pris au hasard dans le reste du tableau
				var sT, nC, nN = aO.length;
				while(--nN) {
					nC = Math.floor(Math.random() * (nN + 1));
					sT = aO[nC];
					aO[nC] = aO[nN];
					aO[nN] = sT;
				}
				return aO;
			}

			// Fonction pour ajouter le bloc de navigation extérieur
			function qkdiapo_nav() {
				// Le code Html à intégrer
				var sHtml = sR+'<div class="'+oCfg.sNav+'"><span class="'+oCfg.sPrv+'">&nbsp;</span><span class="'+oCfg.sNxt+'">&nbsp;</span><span class="'+oCfg.sInf+'">&nbsp;</span></div><!--.'+oCfg.sNav+'-->'+sR;

				// Intégraion des codes Html
				oCfg.oObj.after(sHtml);
				
				// Initialisation des objets de la navigation
				oCfg.oNav = oCfg.oObj.next(sP+oCfg.sNav);
				oCfg.oPrv = oCfg.oNav.children(sP+oCfg.sPrv);
				oCfg.oNxt = oCfg.oNav.children(sP+oCfg.sNxt);
				oCfg.oInf = oCfg.oNav.children(sP+oCfg.sInf);
			}

			// Fonction pour gérer les événements (navigation)
			function qkdiapo_events() {
				
				// Si la navigation automatique est demandée
				if (oCfg.bOto) {
					
					// Lorsqu'on survole le bloc principal du diaporama, on arrête l'animation
					oCfg.oObj.hover(
						function() {
							clearTimeout(rTemp);
							oCfg.bTmp = false;
							return false;
						},
						function() {
							oCfg.bTmp = true;
							if (oCfg.bOto) { rTemp = setTimeout(qkdiapo_show, oCfg.nShw / 2); }
							return false;
						}
					);
				}

				// Si la navigation à l'intérieur du bloc principal est demandée, alors :
				// - lorsqu'on clique à gauche du bloc principal, on affiche le contenu précédent
				// - lorsqu'on clique à droite du bloc principal, on affiche le contenu suivant
				if (oCfg.bInn) {
					
					// Coordonnées bloc principal
					var bxX = oCfg.oObj.offset().left;
					var bxW = oCfg.oObj.width();
					
					// Affichage du curseur
					oCfg.oObj.mousemove(function(e) {
						var pgX = e.pageX;
						if ((pgX - bxX) < (bxW / 2)) {
							$(this).removeClass('nav_nxt').addClass('nav_prv');
						} else {
							$(this).removeClass('nav_prv').addClass('nav_nxt');
						}
					});
					
					// Activation de la navigation
					oCfg.oObj.click(function(e) {
						e.stopPropagation();
						var pgX = e.pageX;
						if ((pgX - bxX) < (bxW / 2)) {
							oCfg.nItr = -1;
						} else {
							oCfg.nItr = 1;
						}
						qkdiapo_show();
						return false;
					});
				}
				
				// Si la navigation avec les touches du clavier est demandée
				// Uniquement pour le premier diaporama s'il y en a plusieurs
				if ((oCfg.bKey) && (nQkd < 2)) {
					$(document).keydown(function(e) {
						var nKey = e.keyCode;
						if ((nKey > 36) && (nKey < 41)) {
							clearTimeout(rTemp);
							oCfg.nItr = (nKey > 38) ? 1 : -1;
							qkdiapo_show();
							return false;
						}
					});
				}
				
				// Si le bloc de navigation extérieur est demandé
				if (oCfg.bOut) {
					
					// Lorsqu'on survole le bloc de navigation, on arrête l'animation
					oCfg.oNav.hover(
						function() {
							clearTimeout(rTemp);
							oCfg.bTmp = false;
							return false;
						},
						function() {
							oCfg.bTmp = true;
							if (oCfg.bOto) { rTemp = setTimeout(qkdiapo_show, oCfg.nShw / 2); }
							return false;
						}
					);

					// Lorsqu'on clique sur la flêche gauche, on affiche l'élément précédent
					oCfg.oPrv.click(
						function() {
							clearTimeout(rTemp);
							oCfg.nItr = -1;
							oCfg.bTmp = false;
							qkdiapo_show();
							return false;
						}
					);

					// Lorsqu'on clique sur la flêche droite, on affiche l'élément suivant
					oCfg.oNxt.click(
						function() {
							clearTimeout(rTemp);
							oCfg.nItr = 1;
							oCfg.bTmp = false;
							qkdiapo_show();
							return false;
						}
					);
				}
			}
		});                         
	};
})(jQuery);

export class analizador {
	constructor(name = "", url = "", fichero = "", estructuraDelFichero = "", start = 0, end = 0, actual = 0, nombreDeSalida = "", nota = "") {
		this.id;
		//Nombre del proyecto
		this._name = name;
		//Si esta ejecutandose actualmente
		this._running = 0;
		//Mensaje de salida a la interfaz
		this._message = "Listo para comenzar";
		//url para analizar
		this._url = url;
		//fichero para analizar
		this._file = fichero;
		//estructura del fichero a analizar
		this._file_strutc = estructuraDelFichero;
		//inicio del bucle
		this._start = start;
		//fin del bucle
		this._end = end;
		//iteraion actual
		this._now = actual;
		//nombre del fichero de salida
		this._file_exit_name = nombreDeSalida;
		//Nota
		this._note = nota;
		//porcentaje completado
		this._porcentaje = 0;
		//lista de extracciones
		this._extraer = [];
		//lista para ignorar
		this._ignorar = [];
		//buscar y reemplazar
		this._busqueda = [];
		//mostrar en el estado
		this._mostrar = [];

		//mostrar resultados en interfaz
		this._warnings = 0;
		this._errors = 0;
		this._interfaz = [];
		//Controla el cambio en la info principal
		this._change

		//variables de tiempo
		this._startTime = 0;
		this._tiempo;
		this._tiempoRunning;
	}

	//Getters

	get name() {
		return this._name;
	}

	get running() {
		return this._running;
	}

	get mensajeDeSalida() {
		return this._message;
	}

	get url() {
		return this._url;
	}

	get fichero() {
		return this._file;
	}

	get estructuraDelFichero() {
		return this._file_strutc;
	}

	get start() {
		return this._start;
	}

	get end() {
		return this._end;
	}

	get actual() {
		return this._now;
	}

	get next() {
		return this._next;
	}

	get nombreDeSalida() {
		return this._file_exit_name;
	}

	get nota() {
		return this._note;
	}

	//setters

	set name(valor) {
		this._name = valor;
	}

	set running(valor) {
		this._running = valor;
	}

	set mensajeDeSalida(valor) {
		this._message = valor;
	}

	set url(valor) {
		this._url = valor;
	}

	set fichero(valor) {
		this._file = valor;
	}

	set estructuraDelFichero(valor) {
		this._file_strutc = valor;
	}

	set start(valor) {
		this._start = valor;
	}

	set end(valor) {
		this._end = valor;
	}

	set actual(valor) {
		this._now = valor;
	}

	set next(valor) {
		this._next = valor;
	}

	set nombreDeSalida(valor) {
		this._file_exit_name = valor;
	}

	set nota(valor) {
		this._note = valor;
	}

	//metodos

	//controla el botón de play & pause
	PausePlay() {
		if (this._running == 0) {
			this._running = 1;
			$("#brand-logo").addClass("fa-pause");
			$("#brand-logo").removeClass("fa-play");
			document.getElementById("brand-logo").title = "Pausar";
			$("#headerEstado").html("Iniciando...");
			$("#tiempoRestante").html("Calculando tiempo restante...</br>");
			$("#abrirPopup").addClass("disabled");
			this.running();
			this._tiempoRunning = window.setInterval(this.restante.bind(this), 1000);
			this._change = 0;
		}
		else {
			this._running = 0;
			$("#brand-logo").addClass("fa-play");
			$("#brand-logo").removeClass("fa-pause");
			document.getElementById("brand-logo").title = "Continuar";
			$("#headerEstado").html("Pausado");
			$("#tiempoRestante").html("");
			$("#abrirPopup").removeClass("disabled");
			clearInterval(this._tiempoRunning);
		}
	}

	running(intento = 0) {
		if (this._now > this._end) {
			this.PausePlay();
			$("#headerEstado").html("Análisis finalizado");
		} else if (this._running == 1) {
			var thisClass = this;
			this.actualizarEstado();
			if (this._change == 0) {
				this._change = 1;
				$("#headerEstado").html('Analizando <div class="spinner-border" role="status"><span class="sr-only">Analizando ...</span></div>');
			}
			$.ajax({
				async: true,
				type: 'GET',
				url: "assets/Data/proxy.php",
				data: { "url": this._url.replace(/\$cambiar/g, this._now) },
				dataType: "html"
			}).done(function (data) {
				var booleano = true;
				for (var k = 0; k < thisClass._ignorar.length; k++) {
					if (thisClass.matchString(data, thisClass._ignorar[k]) != false) {
						booleano = false;
						break;
					}
				}
				if (booleano) {
					thisClass.crearArchivo(thisClass.extraer(data));

				} else {
					thisClass.crearArchivo("$ignorado");
				}
			}).fail(function () {
				console.log("#Error: A001. Ha ocurrido un error en el análisis, intento (" + intento + "/3)");
				if (intento <= 3)
					thisClass.running(++intento);
				else {
					console.log("#Error: A002. Error definitivo de análisis. Pausando el análisis...");
					$("#errores").html(++thisClass._errors);
					thisClass.PausePlay();
				}
			});
		}
	}

	encodeUF8(s) {
		return unescape(encodeURIComponent(s));
	}

	crearArchivo(valor, intento = 0) {
		var thisClass = this;
		$.ajax({
			async: true,
			type: 'GET',
			url: "assets/Data/createFile.php",
			data: { "nameFile": "../outFiles/" + this._file_exit_name, "contenido": btoa(this.encodeUF8(valor)), "iteracion": this._now },
			dataType: "html"
		}).done(function (data) {
			var json = eval("(" + data + ")");
			if (json.escrito == 1) {
				thisClass.actualizarInfoInterfaz(valor);
				thisClass._now++;
				thisClass.running();
			} else if (intento <= 3) {
				console.log("#Errror: E001. Ha ocurrido un error al crear el archivo, intento (" + intento + "/3)");
				thisClass.crearArchivo(valor, ++intento);
			} else {
				console.log("#Error: E002. Error definitivo de escritura. Pausando el análisis...");
				$("#errores").html(++thisClass._errors);
				thisClass.PausePlay();
			}
		}).fail(function () {
			console.log("#Errror: E002. Ha ocurrido un error al crear el archivo, intento (" + intento + "/3)");
			if (intento <= 3)
				thisClass.crearArchivo(valor, ++intento);
			else {
				console.log("#Error: E002. Error definitivo de escritura. Pausando el análisis...");
				$("#errores").html(++thisClass._errors);
				thisClass.PausePlay();
			}
		});
	}

	actualizarStatus(string) {

	}

	//Busca y reemplaza strings
	buscarYReemplazar(string) {
		if (string != null) {
			for (var i = 0; i < this._busqueda.length; i++) {
				var separador = this._busqueda[i].split(":=>");
				string = string.replace(new RegExp(separador[0], "gi"), separador[1]);
			}
			return string;
		}
	}

	extraer(string) {
		var resultado = "";
		for (var i = 0; i < this._extraer.length; i++) {
			var separador = this._extraer[i].split(":=>");
			if (!this.matchString(string, separador[2]) && this.matchString(string, separador[0]) != false) {
				resultado += this.buscarYReemplazar(this.matchString(string, separador[0]).replace(new RegExp(separador[0], "gi"), separador[1] + " "));
			}
		}
		return resultado;
	}

	//encuentra la coincidencia
	matchString(string, buscar) {
		var resultado = string.match(buscar);
		return resultado != null ? resultado[0] : false;
	}

	rellenarInputs() {
		$("#exporatConfiguracion").attr("href", 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.exportar()));
		$("#exporatConfiguracion").attr("download", this._name + ".conf");
		$("#proyectName").val(this._name);
		//url para analizar
		$("#urlProyect").val(this._url);
		//fichero para analizar
		$("#fileProyect").val(this._file);
		//estructura del fichero a analizar
		$("#fileStruct").val(this._file_strutc);
		//inicio del bucle
		$("#initProyect").val(this._start);
		//fin del bucle
		$("#endProyect").val(this._end);
		//iteraion actual
		$("#nowProyect").val(this._now);
		//nombre del fichero de salida
		$("#outputProyect").val(this._file_exit_name);
		//Nota
		$("#noteProyect").val(this._note);

		this.addOptionRow(this._busqueda, "optionsTable");
		this.addOptionRow(this._extraer, "extractTable", 1);
		this.addOptionRow(this._ignorar, "blackTable", 2);
		this.addOptionRow(this._mostrar, "outputTable", 3);
	}

	getAtributes() {
		this._name = $("#proyectName").val();
		//url para analizar
		this._url = $("#urlProyect").val();
		//fichero para analizar
		this._file = $("#fileProyect").val();
		//estructura del fichero a analizar
		this._file_strutc = $("#fileStruct").val();
		//inicio del bucle
		this._start = $("#initProyect").val();
		//fin del bucle
		this._end = $("#endProyect").val();
		//iteraion actual
		this._now = $("#nowProyect").val();
		//nombre del fichero de salida
		this._file_exit_name = $("#outputProyect").val();
		//Nota
		this._note = $("#noteProyect").val();

		this.obetenerTableOptions(this._busqueda);
		this.obetenerTableOptions(this._extraer, "extractTable", 1);
		this.obetenerTableOptions(this._ignorar, "blackTable", 2);
		this.obetenerTableOptions(this._mostrar, "outputTable", 3);
	}

	obetenerTableOptions(atributo, nameTable = "optionsTable", option = 0) {
		var cantidadRows = $("#" + nameTable).attr("data-count");
		var tags = document.querySelectorAll('#' + nameTable + ' tbody  tr');
		//resetear los datos
		atributo.length = 0;
		[].forEach.call(tags, function (col2) {
			var valorActual = "";
			for (var i = 0; i < cantidadRows; i++) {
				valorActual += valorActual != "" ? ":=>" + $(col2).children()[i].textContent : $(col2).children()[i].textContent;
			}
			atributo.push(valorActual);
		});
	}

	replaceTag(tag) {
		var tagsToReplace = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;'
		};
		return tagsToReplace[tag] || tag;
	}

	safe_tags_replace(str) {
		return str.replace(/[&<>"]/g, this.replaceTag);
	}

	addOptionRow(atributo, idTable, option = 0) {
		var resultado = "";
		for (var i = 0; i < atributo.length; i++) {
			resultado += '<tr>';
			var opciones = atributo[i].split(":=>");
			for (var k = 0; k < opciones.length; k++) {
				resultado += '<td class="pt-3-half atributos" id="optionEditable" data-option="' + option + '" data-type="textarea" data-tableid="' + idTable + '" contenteditable="true">' + this.safe_tags_replace(opciones[k]) + '</td>';
			}
			resultado += '<td class="pt-3-half flechas"><span class="table-up"><i class="fas fa-long-arrow-alt-up pointer"aria-hidden="true" data-option="' + option + '" data-tableid="' + idTable + '" id="optionUp"></i></span><span class="table-down"><i data-option="' + option + '" data-tableid="' + idTable + '" class="fas fa-long-arrow-alt-down pointer" aria-hidden="true" id="optionDown"></i></span></td><td><span class="table-remove"><button type="button"class="btn btn-danger btn-rounded btn-sm my-0" id="deleteOptionInput" data-option="' + option + '" data-tableid="' + idTable + '"><i class="fa fa-trash" aria-hidden="true" id="deleteOptionInput" data-option="' + option + '" data-tableid="' + idTable + '"></i></button></span></td>';
		}
		var cell = document.querySelector('#' + idTable + ' tbody');
		if (cell.hasChildNodes()) {
			while (cell.childNodes.length >= 1) {
				cell.removeChild(cell.firstChild);
			}
		}
		$('#' + idTable + ' tbody').append(resultado);
	}

	MaysPrimera(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	cargar() {
		//Reinicio de variables temporales
		this._warnings = 0;
		this._errors = 0;
		this._now = this._start;
		this._interfaz.length = 0;
		this._change = 0;
		this._startTime = this._now;
		this._tiempo = "Calculando tiempo restante...";
		this._tiempoRunning = false;

		$("#headerEstado").html(this._message);
		document.title = (document.title + ' - ' + this._name);

		var midiv = document.createElement("li");
		midiv.setAttribute("class", "nav-item danger");
		midiv.setAttribute("role", "presentation");
		midiv.insertAdjacentHTML('beforeend', '<a class="nav-link" id="borrarProyecto" href="#"><i class="fa fa-trash" id="borrarProyecto"></i> Borrar</a>');
		document.getElementById('proyectosList').after(midiv);

		midiv = document.createElement("li");
		midiv.setAttribute("class", "nav-item");
		midiv.setAttribute("role", "presentation");
		midiv.insertAdjacentHTML('beforeend', '<a class="nav-link" id="abrirPopup" href="#">Configuración</a>');
		document.getElementById('proyectosList').after(midiv);

		for (let index = 0; index < this._mostrar.length; index++) {
			var separador = this._mostrar[index].split(":=>")[1]
			var midiv = document.createElement("li");
			midiv.setAttribute("class", "list-group-item d-flex justify-content-between align-items-center");
			midiv.insertAdjacentHTML('beforeend', this.MaysPrimera(separador) + '<span class="badge badge-primary badge-pill" id="resume' + index + '">0</span>');
			document.getElementById('resumeList').appendChild(midiv);
		}

		this.leerNumeroFilasOutFile();
	}

	leerNumeroFilasOutFile() {
		var thisClass = this;
		$.get("assets/outFiles/" + this._file_exit_name, function (data, status) {
			thisClass.actualizarInfoInterfaz(data);
		}).fail(function () {
			thisClass.actualizarEstado();
		});
	}

	restante() {
			var time = this._now - this._startTime == 0 ? 0 : (this._end - this._now) * 1 / (this._now - this._startTime);
			if (time < 0) { time = 0; }
			var days = Math.floor(time / (3600 * 24));
			var hours = Math.floor(time / 3600);
			var minutes = ("0" + Math.floor((time % 3600) / 60)).slice(-2);
			var seconds = ("0" + (time % 60)).slice(-2);

			days = days == 0 ? "" : days + " d ";
			hours = hours == 0 ? "" : hours + " h ";
			minutes = minutes == 0 ? "" : minutes + " m ";
			seconds = seconds == 0 ? "" : seconds + " s ";
			var result = days + hours + minutes + seconds;  // h:mm:ss
			if (result == null || result == undefined || result == "") { result = this._tiempo; } else { result = "Tiempo restante: " + result; }
			this._tiempo = result;
			if (time < 0) { result = this._tiempo;}
			$("#tiempoRestante").html(result+"</br>");
			this._startTime = this._now;
			console.log(time);
	}

	actualizarInfoInterfaz(data) {
		var matches = data.match(/\$warning/g);
		if (matches) {
			this._warnings += matches.length;
			$("#avisos").html(this._warnings);
		}
		matches = data.match(/\r\n/g);
		if (matches) {
			this._now = matches.length + 1;
			this.actualizarEstado();
		}
		for (let index = 0; index < this._mostrar.length; index++) {
			var separador = this._mostrar[index].split(":=>")[0];
			matches = data.match(new RegExp(separador, "gi"));
			var valueMostrar = 0;
			if (matches) {
				valueMostrar = matches.length;
			}
			if (this._interfaz.length == index){
				this._interfaz.push(valueMostrar);
			}
			else
				this._interfaz[index] += valueMostrar;
			$("#resume" + index).html(this._interfaz[index]);
		}
		$("#correcto").html(Math.abs(this._warnings - this._now + 1));
	}

	actualizarEstado() {
		var actual = this._now > this._end ? this._end : this._now;
		if (actual == this._end) {
			$("#headerEstado").html("Análisis finalizado");
			$("#runStop").addClass("disabled");
		}
		$("#contadorIteraciones").html(actual + "/" + this._end);
		this._porcentaje = (this._now * 100 / this._end).toFixed(2);
		this._porcentaje = this._porcentaje <= 0 || this._now == this._start ? 0 : this._porcentaje;
		this._porcentaje = this._porcentaje >= 100 ? 100 : this._porcentaje;
		$("#barrarDeProgreso").attr("aria-valuenow", this._porcentaje);
		$("#barrarDeProgreso").css({ "width": this._porcentaje + "%" });
		$("#barrarDeProgreso").html(this._porcentaje);
		$("#ultimoAnalisis").html(this.fetchHeader("assets/outFiles/" + this._file_exit_name, 'Last-Modified'));
	}

	fetchHeader(url, wch) {
		try {
			var req = new XMLHttpRequest();
			req.open("HEAD", url, false);
			req.send(null);
			if (req.status == 200) {
				var fecha = new Date(req.getResponseHeader(wch));
				return ("0" + fecha.getDay()).slice(-2) + "/" + ("0" + (fecha.getMonth() + 1)).slice(-2) + "/" + fecha.getFullYear() + " " + ("0" + fecha.getHours()).slice(-2) + ":" + ("0" + fecha.getMinutes()).slice(-2) + ":" + ("0" + fecha.getSeconds()).slice(-2);
			}
			else return "Nunca";
		} catch (er) {
			return er.message;
		}
	}

	exportar() {
		return btoa(JSON.stringify(this));
	}

	importar(contenido) {
		var old_id = this.id;
		var old_name = this._name;
		Object.assign(this, JSON.parse(atob(contenido)));
		this.id = old_id;
		this._name = old_name;
		this.rellenarInputs();
	}

}
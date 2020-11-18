import {
	analizador
} from './analizador.js';

// En la siguiente línea, puede incluir prefijos de implementación que quiera probar.
var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// No use "var indexedDB = ..." Si no está en una función.
// Por otra parte, puedes necesitar referencias a algun objeto window.IDB*:
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
// (Mozilla nunca ha prefijado estos objetos, por lo tanto no necesitamos window.mozIDB*)

var dataBase = null;
var db;
var proyecto = null;

$(document).ready(function () {
	startDB();
	var classname = document.getElementsByClassName("atributos");
	document.getElementById('importarConfiguracion')
		.addEventListener('change', leerArchivo, false);
});

if (!window.indexedDB) {
	console.log("Su navegador no soporta una versión estable de indexedDB. Tal y como las características no serán validas");
}
//lee el archivo de configuración
function leerArchivo(e) {
	var archivo = e.target.files[0];
	if (!archivo) {
		return;
	}
	var lector = new FileReader();
	lector.onload = function (e) {
		var contenido = e.target.result;
		proyecto.importar(contenido);
		update(proyecto.id);
	};
	lector.readAsText(archivo);
}

// funcion para obtener los valores del GET
function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//Iniciamos la base de datos
function startDB() {
	// dejamos abierta nuestra base de datos
	dataBase = window.indexedDB.open("proyectos");
	dataBase.onupgradeneeded = function (e) {
		var active = dataBase.result;
		// Se crea un almacén para contener la información de nuestros cliente
		// Se usará "ssn" como clave ya que es garantizado que es única                   
		var object = active.createObjectStore('proyecto', {
			keyPath: 'id',
			autoIncrement: true
		});
		// Se crea un índice para buscar proyectos por nombres
		object.createIndex('nombre', '_name', {
			unique: true
		});
	};

	dataBase.onerror = function (event) {
		// Hacer algo con dataBase.errorCode!
		console.log("Ha ocurrido un error al cargar la base de datos");
	};
	dataBase.onsuccess = function (event) {
		db = dataBase.result;
		console.log("¡Base de datos cargada!");
		load(getParameterByName("proyecto"));
		loadAll();
	};
}

function conexion(dbName = "proyecto", mode = "readonly") {
	return db.transaction([dbName], mode);
}

function add() {
	var data = conexion("proyecto", "readwrite");
	var object = data.objectStore("proyecto");
	var objeto = new analizador();
	var name = $("#newProyectName").val();
	if (name != undefined && name != "") {
		objeto.name = name;
		objeto.url = $("#newUrlProyect").val();
		var request = object.put(objeto);
		$(".newProyect-modal").css({
			"display": ""
		});

		request.onerror = function (e) {
			alert(request.error.name + '\n\n' + request.error.message);
		};

		data.oncomplete = function (e) {
			location.href = "?proyecto=" + name;
		};
	} else {
		$("#aviso").html("Debe rellenar al menos el nombre");
	}
}

function load(nombre) {
	if (nombre != null) {
		var data = conexion();
		var object = data.objectStore("proyecto");
		var index = object.index("nombre");
		var request = index.get(String(nombre));

		request.onerror = function (event) {
			// Handle errors!
			console.log("Ha ocurrido un error en la funcion load(" + nombre + ")");
		}

		request.onsuccess = function () {
			proyecto = new analizador();
			Object.assign(proyecto, request.result);
			$("#nameProyect").html(" - " + proyecto.name);
			proyecto.cargar();
		}

	}
}

function update(id) {
	var object = conexion("proyecto", "readwrite").objectStore("proyecto");
	var request = object.get(id);
	request.onerror = function (event) {
		// Handle errors!
	};
	request.onsuccess = function (event) {

		// Put this updated object back into the database.
		var requestUpdate = object.put(proyecto);
		requestUpdate.onerror = function (event) {
			console.log("Ha ocurrido un error al tratar de guardar el proyecto " + id + "");
			console.log(requestUpdate.error.name + '\n\n' + requestUpdate.error.message);

		};
		requestUpdate.onsuccess = function (event) {
			console.log("Proyecto guardado con éxito");
		};
	};
}

function deleteByID(id) {
	var request = conexion("proyecto", "readwrite").objectStore("proyecto").delete(id);

	request.onsuccess = function (event) {
		console.log("Proyecto eliminado");
		location.href = "?";
	};

	request.onerror = function (event) {
		console.log("Error al eliminar el proyecto");
	};

}

function loadAll() {

	var data = conexion();
	var object = data.objectStore("proyecto");

	var elements = [];

	object.openCursor().onsuccess = function (e) {

		var result = e.target.result;

		if (result === null) {
			return;
		}

		elements.push(result.value);
		result.continue();

	};

	data.oncomplete = function () {

		var outerHTML = '';

		for (var key in elements) {
			if (elements[key]._name != getParameterByName("proyecto")) {
				var midiv = document.createElement("a");
				midiv.setAttribute("class", "dropdown-item");
				midiv.setAttribute("href", "?proyecto=" + elements[key]._name);
				midiv.insertAdjacentHTML('beforeend', elements[key]._name);
				document.getElementById('listaDeProyectos').before(midiv);
			}
		}

		elements = [];
	};

}
//acciones
document.addEventListener("click", function (event) {
	var div = event.target;
	var divParent = div.parentNode;
	var divParent2 = divParent.parentNode;
	switch (div.id) {
		case 'cerrarPopup':
			$(".modal").css({
				"display": ""
			});
			break;
		case 'abrirPopup':
			if (proyecto != null)
				proyecto.rellenarInputs();
			$(".config").css({
				"display": "block"
			});
			break;
		case 'guardarProyecto':
			if (proyecto != null)
				proyecto.getAtributes();
			$(".modal").css({
				"display": ""
			});
			if (proyecto != null)
				update(proyecto.id);
			break;
		case "addOptionInput":
			$('#' + $(div).attr("data-idtable") + ' tbody').append(addOptionRow($(div).attr("data-count"), $(div).attr("data-idtable"), $(div).attr("data-option")));
			break;
			//elimina una fila de la tala de opciones de input
		case "deleteOptionInput":
			$(divParent).parents('tr').detach();
			break;
			//Sube un puesto en el orden de DATALIST
		case "optionUp":
			var row = $(divParent).parents('tr');
			if (row.index() > 0) {
				row.prev().before(row.get(0));
			}
			break;
			//Baja un puesto en el orden de DATALIST
		case "optionDown":
			var row = $(divParent).parents('tr');
			row.next().after(row.get(0));
			break;
		case "nuevoProyecto":
			$(".newProyect-modal").css({
				"display": "block"
			});
			break;
		case "guardarNewProyecto":
			add();
			break;
		case "brand-logo":
		case "runStop":
			if (proyecto != null)
				proyecto.PausePlay();
			break;
		case "borrarProyecto":
			$(".deletedP").css({
				"display": "block"
			});
			break;
		case "borrarProyectoYes":
			if (proyecto != null)
				deleteByID(proyecto.id);
			break;
		default:
	}
});

//funcion para añadir una fila con n columnas editables a la tabla de opciones del input
function addOptionRow(num, idTable, option = 0) {
	var resultado = '<tr>';
	for (var i = 0; i < num; i++) {
		resultado += '<td class="pt-3-half atributos" data-type="textarea" id="optionEditable" data-option="' + option + '" data-tableid="' + idTable + '" contenteditable="true"></td>';
	}
	resultado += '<td class="pt-3-half flechas"><span class="table-up"><i class="fas fa-long-arrow-alt-up pointer"aria-hidden="true" data-option="' + option + '" data-tableid="' + idTable + '" id="optionUp"></i></span><span class="table-down"><i data-option="' + option + '" data-tableid="' + idTable + '" class="fas fa-long-arrow-alt-down pointer" aria-hidden="true" id="optionDown"></i></span></td><td><span class="table-remove"><button type="button"class="btn btn-danger btn-rounded btn-sm my-0" id="deleteOptionInput" data-option="' + option + '" data-tableid="' + idTable + '"><i class="fa fa-trash" aria-hidden="true" id="deleteOptionInput" data-option="' + option + '" data-tableid="' + idTable + '"></i></button></span></td></tr>';
	return resultado;
} //Para guardar el contenido de las opciones de la tabla

function waitUntilFunction(boolean, value, success, error, count = 300, interval = 20) {
	if (boolean == value) {
		success();
		return;
	}
	// The call back isn't ready. We need to wait for it 
	setTimeout(function () {
		if (!count) {
			// We have run out of retries 
			if (error !== undefined) {
				error();
			}
		} else {
			// Try again 
			waitUntilFunction(boolean, value, success, error, count - 1, interval);
		}
	}, interval);

}

//Localizador de estructura
$(window).load(function () {

	$.fn.fullSelector = function () {
		var path = this.parents().addBack();
		var quickCss = path.get().map(function (item) {
			var self = $(item),
				id = item.id ? '#' + item.id : '',
				clss = item.classList.length ? item.classList.toString().split(' ').map(function (c) {
					return '.' + c;
				}).join('') : '',
				name = item.nodeName.toLowerCase(),
				index = self.siblings(name).length ? ':nth-child(' + (self.index() + 1) + ')' : '';

			if (name === 'html' || name === 'body') {
				return name;
			}
			return name + index + id + clss;

		}).join(' > ');

		return quickCss;
	};

	// click on part of the page to see the CSS selector


	$(document).on('click', '*', function () {
		$('#css').text($(this).fullSelector());

		return false;
	});

});
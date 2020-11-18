<?php
$json["escrito"] = 0;
if(isset($_GET["nameFile"]) && !empty($_GET["nameFile"]) && isset($_GET["contenido"]) && !empty($_GET["contenido"]) && isset($_GET["iteracion"]) && !empty($_GET["iteracion"])){
	$numero = intval($_GET["iteracion"]);
	if($archivo = fopen(stripslashes($_GET["nameFile"]), 'ab')){
		fwrite($archivo, pack("CCC",0xef,0xbb,0xbf));
		fwrite($archivo,"[$numero];".utf8_decode(base64_decode($_GET["contenido"]))."\r\n");

		$json["escrito"] = 1;
		fclose($archivo);
	}
}
echo json_encode($json);
?>
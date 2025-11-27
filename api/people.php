<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getPeople($pdo);
        break;
    case 'POST':
        createPerson($pdo);
        break;
    case 'PUT':
        updatePerson($pdo);
        break;
    case 'DELETE':
        deletePerson($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Método não permitido"]);
        break;
}


function getPeople($pdo)
{
    try {
        $stmt = $pdo->query("SELECT * FROM pessoas ORDER BY id DESC");
        $pessoas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($pessoas);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Erro: " . $e->getMessage()]);
    }
}

function createPerson($pdo)
{
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->nome) || empty($data->cpf) || empty($data->idade)) {
        http_response_code(400);
        echo json_encode(["message" => "Dados incompletos. Nome, CPF e Idade são obrigatórios."]);
        return;
    }

    if (strlen($data->nome) < 3) {
        http_response_code(400);
        echo json_encode(["message" => "O nome deve ter pelo menos 3 letras."]);
        return;
    }

    try {
        $sql = "INSERT INTO pessoas (nome, cpf, idade) VALUES (:nome, :cpf, :idade)";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':cpf', $data->cpf);
        $stmt->bindParam(':idade', $data->idade);

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Pessoa criada."]);
        }
    } catch (PDOException $e) {
        if ($e->errorInfo[1] === 1062) {
            http_response_code(409);
            echo json_encode(["message" => "Erro: Este CPF já está cadastrado no sistema."]);
            exit;
        }

        http_response_code(500);
        echo json_encode(["message" => "Erro ao criar: " . $e->getMessage()]);
    }
}

function updatePerson($pdo)
{
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id) || empty($data->nome) || empty($data->cpf) || empty($data->idade)) {
        http_response_code(400);
        echo json_encode(["message" => "Dados incompletos para atualização."]);
        return;
    }

    try {
        $sql = "UPDATE pessoas SET nome = :nome, cpf = :cpf, idade = :idade WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':cpf', $data->cpf);
        $stmt->bindParam(':idade', $data->idade);
        $stmt->bindParam(':id', $data->id);

        if (!$stmt->execute()) {
            http_response_code(503);
            echo json_encode(["message" => "Não foi possível fazer a atualização."]);
            return;
        }

        echo json_encode(["message" => "Pessoa atualizada."]);

    } catch (PDOException $e) {
        if ($e->errorInfo[1] == 1062) {
            http_response_code(409);
            echo json_encode(["message" => "Erro: Este CPF já pertence a outra pessoa."]);
            exit;
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro interno: " . $e->getMessage()]);
        }
    }
}


function deletePerson($pdo)
{
    $id = isset($_GET['id']) ? $_GET['id'] : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(["message" => "Id não encontrado"]);
        return;
    }

    try {
        $sql = "DELETE FROM pessoas WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id);

        if (!$stmt->execute()) {
            http_response_code(503);
            echo json_encode(["message" => "Não foi possível deletar usuario"]);
            return;
        }

        echo json_encode(["message" => "Pessoa deletada."]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Erro: " . $e->getMessage()]);
    }
}

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
//위에 두줄은 DynamoDB에 접근하기 위한 sdk 입니다.
//이벤트를 처리하기위한 핸들러입니다. 호출시 작동합니다.
exports.handler = async (event, context) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    let body; //반환값을 담을 변수
    let statusCode = '200'; //상태코드이다.
    const headers = { //헤더 부분
        'Content-Type': 'application/json',
    };

    var exitstatus; // 대출여부를 담을 변수이다.

    var paramsbooks = {//books 테이블 접근하기 위한 변수
        TableName: "books",
    }
    var paramsusers = {//users 테이블 접근하기 위한 변수
        TableName: "users",
    }
    
    try {
        switch (event.httpMethod) {
            case 'PUT': //대출/반납은 원래 있던 데이터의 수정으로 PUT 사용
                if(event.resource=="/books/{code}/borrow"){ // 책/코드/대출 이런식이다.
                    paramsbooks.Key={"code":event.pathParameters.code}; //books객체에 키 값 추가
                    exitstatus=await dynamo.get(paramsbooks).promise(); //빌릴 책의 정보를 저장한다.

                    if(exitstatus.Item.exits == false){ //대출여부가 false 라면
                        
                        paramsbooks.UpdateExpression = "set exits = :e, userid = :u";
                        paramsbooks.ExpressionAttributeValues = { ":e" : true ,":u" : JSON.parse(event.body).id};
                        body = await dynamo.update(paramsbooks).promise();
                        //위에 세줄은 책 데이터에서 대출여부(exits)와 대출자(userid)를 수정하는 요청
                        //exits:faluse -> true , userid:"" -> "i1"
                        
                        paramsusers.Key={"id":JSON.parse(event.body).id};
                        paramsusers.UpdateExpression = "set booklist = :b";
                        paramsusers.ExpressionAttributeValues = { ':b' : event.pathParameters.code };
                        //위에 세줄은 유저 데이터에서 booklist를 수정하는 요청
                        //booklist:"" - > "Google study"
                        
                        body = await dynamo.update(paramsusers).promise();

                    }
                }
                if(event.resource=="/books/{code}/return"){ //반납 요청일때
                    paramsbooks.Key={"code":event.pathParameters.code}; //키 값 추가
                    exitstatus=await dynamo.get(paramsbooks).promise();//책 상태값 저장

                    if(exitstatus.Item.exits == true && exitstatus.Item.userid == JSON.parse(event.body).id){ //책이 대출상태일때
                        //이때 현재 books DB에 userid 와 회원 id가 같은지 비교한다.
                        paramsbooks.UpdateExpression = "set exits = :e, userid = :u";
                        paramsbooks.ExpressionAttributeValues = { ":e" : false ,":u" : ""};
                        body = await dynamo.update(paramsbooks).promise();
                        //위에 세줄은 책 데이터에서 대출여부(exits)와 대출자(userid)를 수정하는 요청
                        //exits:true -> flause , userid:"i1" -> ""
                        
                        paramsusers.Key={"id":JSON.parse(event.body).id};
                        paramsusers.UpdateExpression = "set booklist = :b";
                        paramsusers.ExpressionAttributeValues = { ':b' : "" };
                        body = await dynamo.update(paramsusers).promise();
                        //위에 세줄은 유저 데이터에서 booklist를 수정하는 요청
                        //booklist:"Google study" - > ""
                    }
                }
                break;
            default:
                throw new Error(`Unsupported method "${event.httpMethod}"`);
        }
    } catch (err) {
        statusCode = '400';
        body = err.message;
    } finally {
        body = JSON.stringify(body);
    }

    return {
        statusCode,
        body,
        headers
    };
};

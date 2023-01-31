import styled from "styled-components";

import Input from "../components/Input/Input";
import Button from "../components/Button";
import { checkUser } from "../utils/SP_APPI";

const Container = styled.div`
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(130.23deg, #26C485 0.52%, #048BA8 100%);
    
`
const LoginContainer = styled.div`
    min-width: 600px;
    background: white;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
    
    & h2{
        font-weight: 600px;
        text-transform: uppercase;
    }
`;

const ControlButton = styled(Button)`
    width: 100%;
    margin-top: 20px;
    border-radius: 60px;
`;

export default function Login(){

    const LogIn = async evt => {
        evt.preventDefault();
        let data = {
            name: evt.target.name.value,
            pswd: evt.target.pswd.value
        }

        let res = await checkUser(data);
        console.log(res);
        if(res.err === false){
            localStorage.setItem('session-started', true);
            localStorage.setItem('username', data.name);
            localStorage.setItem('sp_rol', res.rol);
            localStorage.setItem('sp_user_id', res.id);
            // console.log(res);
            window.location.assign('/inicio');
        }
        else{
            alert('Error al iniciar sesión. Favor de verificar nombre y contraseña');
        }
    }

    return(
        <Container>
            <LoginContainer>
                <h2 style={ {textAlign: 'center'}}>Inicio de sesión</h2>

                <form onSubmit={ LogIn }>
                    <Input type='text' placeholder='Nombre' label='Nombre' name='name'/>
                    <Input type='password' placeholder='Contraseña' label='Contraseña' name='pswd'/>

                    <ControlButton type='submit' style={ {marginTop: 40} } className="bg-blue">ACCEDER</ControlButton>
                </form>
            </LoginContainer>
        </Container>
    );
}
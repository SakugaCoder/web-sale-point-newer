import styled from "styled-components";
import { useState } from "react";

const UserPictureContainer = styled.div`
    width: 100px;
    height: 100px;
    background-color: white;
    border: solid 1px #000;
    border-radius: 100px;
    display: flex;

    &:hover{
        cursor: pointer;
    }
    
    p{
        margin: auto;
        font-size: 30px;
        font-weight: 600;
    }
`;

const UserOptions = styled.div`
    background: red;
    position: absolute;
    top: 125px;
    display: flex;

    &:hover{
        display: block;
    }
    
    & ul{
        list-style: none;
        margin: auto;
        padding: 0px;
    }

    & li{
        display: block;
        width: 100%;
    }

    & li button{
        background: #000;
        color: #fff;
        padding: 8px;
        border: none;
        cursor: pointer;
        font-weight: 600;
    }
`;

export default function UserPicture(props){
    const [optionVisible, setOptionsVisible] = useState(false);
    const toggleOptionsMenu= () => {
        setOptionsVisible(!optionVisible);
    };

    const logOut = () => {
        localStorage.removeItem('session-started');
        localStorage.removeItem('username');
        localStorage.removeItem('sp_rol');
        window.location.assign('/');
    };

    return(
        <UserPictureContainer onClick={ toggleOptionsMenu }>
            <p>{ localStorage.getItem('username').substring(0,2).toUpperCase() }</p>
            { optionVisible ?
            <UserOptions className="hidden">
                <ul>
                    <li><button onClick={ logOut }>Cerrar sesión</button></li>
                </ul>
            </UserOptions>
            : null}
        </UserPictureContainer>
    );
}
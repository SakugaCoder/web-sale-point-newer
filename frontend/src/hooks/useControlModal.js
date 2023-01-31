import styled from "styled-components";

const ProductCardModal = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    & img{
        margin: auto;
        max-width: 200px;
    }

    & strong{
        text-align: center;
        font-size: 20px;
        margin-bottom: 20px;
    }
`;

const ModalForm = styled.form`
    width: 90%;

    & label{
        display: block;
        max-width: 100%;
    }

    & label input{
        width: 100%;
        font-size: 18px;
        margin-bottom: 40px;
    }
`;

const ModalButtons = styled.div`
    display: flex;
    justify-content: space-between;

    & button{
        width: 45%;
    }
`;

export function EditModal(){
    let modalContent = item_data => {
        return <ProductCardModal>
            <img src={item_data.img }/>

            <strong>$ { item_data.price }</strong>

            <ModalForm onSubmit={ event => addProductToBasket(event, item_data) }>
                <Input placeholder='Cantidad en kg' label='Cantidad en kilogramos' name='kg' required/>
                <ModalButtons>
                    <Button className="bg-red" onClick={ handleModalClose }>Cancelar</Button>
                    <Button type='submit' className="bg-primary">Guardar</Button>
                </ModalButtons>
            </ModalForm>
            
        </ProductCardModal>
    }


}
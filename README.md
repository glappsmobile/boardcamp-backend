Deixaram o estagiário implementar as novas funcionalidades mas ninguém ensinou que ele poderia utilizar o `JOIN` do SQL para juntar os dados :(

A funcionalidade a ser implementada era buscar os produtos do banco de dados, trazendo junto aos produtos o nome da categoria do produto.

Desconhecendo a operação, o estagiário buscou todos os produtos com uma query e então, para **cada** **produto**, buscou no banco a categoria e inseriu a nova propriedade no objeto.

O banco de dados tem o seguinte formato:

- Tabela `categories`:
    - `id`, inteiro gerado automaticamente pelo banco
    - `name`, string que representa o nome da categoria
- Tabela `products`:
    - `id`, inteiro gerado automaticamente pelo banco
    - `name`, string que representa o nome do produto
    - `price`, inteiro que representa o preço do produto em centavos
    - `categoryId`, inteiro que identifica a categoria do produto

No back-end, estão implementadas as seguintes rotas:

- **GET** /products/:id
    
    Busca um produto pelo `id` fornecido como parâmetro da rota, junto de sua categoria. Responde com um objeto no formato
    
    ```jsx
    {
      id: 1,
      name: 'Nome do produto',
      price: 10000,
      categoryId: 1,
      categoryName: 'Nome da categoria'
    }
    ```
    
- **GET** /products
    
    Busca todos os produtos, junto de suas categorias. Responde com um array no formato
    
    ```jsx
    [
      {
        id: 1,
        name: 'Nome do produto',
        price: 10000,
        categoryId: 1,
        categoryName: 'Nome da categoria'
      },
      {
        id: 2,
        name: 'Nome do produto 2',
        price: 20000,
        categoryId: 1,
        categoryName: 'Nome da categoria'
      },
    ]
    ```
    

Reescreva as funções das rotas para utilizar `JOIN` ao invés de buscar pelo JavaScript e ligar os dados, mantendo o formato da resposta.

**Como a coluna `categoryId` tem letra maiúscula, ela sempre deve ser escrita entre aspas duplas: `"categoryId"`**
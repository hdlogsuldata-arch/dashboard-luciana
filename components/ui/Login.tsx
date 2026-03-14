export default function TelaDeLog() {
  return (
    <div className="flex flex-row items-center gap-40 justify-center bg-blue-900 h-screen w-screen">
      {/* Parte da logo e descrição */}
      <div className="flex-col items-center bg-white justify-center w-150 h-180">
        Teste 1
      </div>
      {/* Parte que vai ter o login de fato */}
      <div className="flex flex-col items-center rounded-xl bg-blue-950 gap-5 w-150 h-180 text-black">
        <div className="flex flex-col items-center bg-white h-40 w-120 mt-10">
          Parte pro bem-vindo de volta e as letras pequenas
        </div>
        <div className="flex flex-col items-center bg-white h-30 w-120">
          Parte pro "usuário" e o input de usuário
        </div>
        <div className="flex flex-col items-center bg-white h-30 w-120">
          Parte pra "Senha" e o input de senha
        </div>
        <div className="flex flex-col items-center bg-white h-40 w-120">
          Div do final com botão de entrar, mostrar senha e esqueci a senha
        </div>
      </div>
    </div>
  );
}
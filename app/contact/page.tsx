export default function ContactPage() {
  return (
    <div className="mx-auto md:w-3/4 flex-col justify-center items-center p-4 bg-gray-100">

      <h2 className="text-xl font-semibold text-gray-800 mb-4">Contacto</h2>
      <div className="w-full rounded-xl p-4 bg-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]">

        <p className="text-gray-700 mb-3">Para contactar al equipo de Pirateca puedes escribir un mail a <span className="font-semibold">pirateca [arroba] pm.me </span>.</p>
        <p className="text-gray-700">También puedes contactarnos en nuestro <a href="https://t.me/piratecas" className="text-blue-600 hover:text-blue-800 hover:underline">telegram</a>.</p>
      </div>


    </div>
  )
}

# Recta final 🏁

Cuenta regresiva para el fin de las clases y tracker de exámenes, pensada para el celular y la compu.

Abrí `index.html` en el navegador (o publicá la carpeta en cualquier hosting estático, por ejemplo GitHub Pages) y listo. En el celular se puede agregar a la pantalla de inicio y se abre como una app.

## Qué muestra

**Pestaña Días**
- Los **días de clase** que quedan hasta el acto (sin contar hoy), los días totales, las semanas de cole y los días libres (findes y feriados).
- Una **regla** con el porcentaje del año escolar ya hecho, desde el primer día de clases hasta el acto.
- La **próxima parada**: el inicio del período de intensificación, con su propia barra y cuenta.
- Un **calendario** de lo que queda, con colores por tipo de día (clase, intensificación, finde, feriado, acto) y los días que pasan tachados.
- Post-its con datos para darte ánimo: lunes de clase que quedan, findes, próximo feriado y semanas ya hechas.

**Pestaña Exámenes**
- Una tarjeta por materia. **Tocala** cuando rindas un examen y se tacha uno (con confeti y la opción de deshacer).
- El **+** de cada tarjeta suma un examen a esa materia; el lápiz sirve para renombrarla, cambiar ícono y color, corregir cantidades o borrarla.
- **Agregar materia** crea una tarjeta nueva.

## Cómo cuenta

- La fecha de hoy sale del dispositivo, así que todo se actualiza solo cada día (también si la app queda abierta pasada la medianoche).
- Días de clase: de lunes a viernes, sin feriados, desde mañana hasta el acto inclusive.
- Las fechas del año (primer día, intensificación, acto) y los feriados se cambian con el botón del calendario, arriba a la derecha.

Fechas cargadas para 2026: clases desde el 2/3, intensificación desde el 2/11, acto el 27/11 y feriados el 12/10, 9/11 y 23/11.

Para ver cómo se ve la app otro día, agregá `?hoy=AAAA-MM-DD` a la dirección (por ejemplo `index.html?hoy=2026-11-02`).

## Dónde se guarda

Los exámenes y las fechas se guardan en el navegador (`localStorage`). Si la app se abre como Artifact de Claude, además se sincronizan entre tus dispositivos.

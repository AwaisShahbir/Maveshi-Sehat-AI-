module.exports = (io, pool) => {
  io.on('connection', (socket) => {
    console.log('🔌 User connected to WebSocket:', socket.id);

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`👤 Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('send_message', async (data) => {
      try {
        const { conversationId, senderId, message, imageUrl, isPrescription, prescriptionData, isVaccination, vaccinationData, consultationId } = data;

        const result = await pool.query(
          `INSERT INTO messages (conversation_id, sender_id, message, image_url, is_prescription, prescription_data, is_vaccination, vaccination_data, consultation_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [
            conversationId,
            senderId,
            message || null,
            imageUrl || null,
            isPrescription || false,
            prescriptionData ? JSON.stringify(prescriptionData) : null,
            isVaccination || false,
            vaccinationData ? JSON.stringify(vaccinationData) : null,
            consultationId || null
          ]
        );

        const savedMessage = result.rows[0];

        io.to(conversationId.toString()).emit('receive_message', savedMessage);
      } catch (err) {
        console.error('Socket error sending message:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });
};

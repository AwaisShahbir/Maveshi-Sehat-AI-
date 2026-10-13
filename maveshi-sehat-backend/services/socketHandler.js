const { sendNotification } = require('./notificationService');

module.exports = (io, pool) => {
  io.on('connection', (socket) => {
    console.log('🔌 User connected to WebSocket:', socket.id);

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`👤 Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`🔔 Socket ${socket.id} joined personal notification room: user_${userId}`);
      }
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

        // Broadcast to the conversation room
        io.to(conversationId.toString()).emit('receive_message', savedMessage);

        // Find recipient in conversation and send notification
        try {
          const convRes = await pool.query('SELECT farmer_id, vet_id FROM conversations WHERE id = $1', [conversationId]);
          if (convRes.rows.length > 0) {
            const { farmer_id, vet_id } = convRes.rows[0];
            const recipientId = Number(senderId) === Number(farmer_id) ? vet_id : farmer_id;

            if (recipientId) {
              const senderRes = await pool.query('SELECT full_name FROM users WHERE id = $1', [senderId]);
              const senderName = senderRes.rows[0]?.full_name || 'Someone';

              if (isPrescription) {
                await sendNotification({
                  pool,
                  io,
                  userId: recipientId,
                  type: 'prescription',
                  title_en: 'New Prescription Issued',
                  title_ur: 'نیا نسخہ جاری کیا گیا',
                  message_en: `Dr. ${senderName} issued a new prescription for your consultation.`,
                  message_ur: `ڈاکٹر ${senderName} نے آپ کی مشاورت کے لیے ایک نیا نسخہ جاری کیا ہے۔`,
                  data: {
                    conversationId,
                    consultationId,
                    targetScreen: 'Chat'
                  }
                });
              } else {
                await sendNotification({
                  pool,
                  io,
                  userId: recipientId,
                  type: 'chat',
                  title_en: `New message from ${senderName}`,
                  title_ur: `${senderName} کی طرف سے نیا پیغام`,
                  message_en: message ? (message.length > 60 ? `${message.substring(0, 57)}...` : message) : 'Sent an attachment',
                  message_ur: message || 'ایک فائل بھیجی ہے',
                  data: {
                    conversationId,
                    senderId,
                    targetScreen: 'Chat'
                  }
                });
              }
            }
          }
        } catch (notifErr) {
          console.error('Error generating notification for message:', notifErr.message);
        }
      } catch (err) {
        console.error('Socket error sending message:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });
};

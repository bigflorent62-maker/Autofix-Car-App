import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export async function createNotification({ recipientEmail, type, title, message, link, appointmentId }) {
  try {
    await base44.entities.Notification.create({
      recipient_email: recipientEmail,
      type,
      title,
      message,
      link,
      appointment_id: appointmentId,
      read: false
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export async function notifyAppointmentCreated(appointment, workshop) {
  await createNotification({
    recipientEmail: workshop.owner_email,
    type: 'appointment_created',
    title: 'Nuova richiesta appuntamento',
    message: `${appointment.customer_name} ha richiesto un appuntamento per ${appointment.car_brand} ${appointment.car_model}`,
    link: createPageUrl('WorkshopDashboard'),
    appointmentId: appointment.id
  });

  await createNotification({
    recipientEmail: appointment.customer_email,
    type: 'appointment_created',
    title: 'Richiesta inviata',
    message: `La tua richiesta di appuntamento con ${workshop.name} è stata inviata con successo`,
    link: createPageUrl('MyAppointments'),
    appointmentId: appointment.id
  });
}

export async function notifyAppointmentConfirmed(appointment, workshop) {
  await createNotification({
    recipientEmail: appointment.customer_email,
    type: 'appointment_confirmed',
    title: 'Appuntamento confermato!',
    message: `${workshop.name} ha confermato il tuo appuntamento`,
    link: createPageUrl('MyAppointments'),
    appointmentId: appointment.id
  });
}

export async function notifyTimeChangeProposed(appointment, workshop, proposedBy) {
  const recipientEmail = proposedBy === 'workshop' ? appointment.customer_email : workshop.owner_email;
  const senderName = proposedBy === 'workshop' ? workshop.name : appointment.customer_name;
  
  await createNotification({
    recipientEmail,
    type: 'time_change_proposed',
    title: 'Proposta cambio orario',
    message: `${senderName} ha proposto un nuovo orario per l'appuntamento`,
    link: proposedBy === 'workshop' ? createPageUrl('MyAppointments') : createPageUrl('WorkshopDashboard'),
    appointmentId: appointment.id
  });
}

export async function notifyAppointmentCompleted(appointment, workshop) {
  await createNotification({
    recipientEmail: appointment.customer_email,
    type: 'appointment_completed',
    title: 'Appuntamento completato',
    message: `Il tuo appuntamento con ${workshop.name} è stato completato. Lascia una recensione!`,
    link: createPageUrl('WriteReview') + `?appointment=${appointment.id}`,
    appointmentId: appointment.id
  });
}

export async function notifyAppointmentDeclined(appointment, workshop) {
  await createNotification({
    recipientEmail: appointment.customer_email,
    type: 'appointment_declined',
    title: 'Appuntamento non disponibile',
    message: `${workshop.name} non può accettare la tua richiesta`,
    link: createPageUrl('MyAppointments'),
    appointmentId: appointment.id
  });
}

export async function notifyMessageReceived(message, appointment, senderName) {
  const recipientEmail = message.sender_type === 'customer' ? appointment.workshop_owner_email : appointment.customer_email;
  
  await createNotification({
    recipientEmail,
    type: 'message_received',
    title: 'Nuovo messaggio',
    message: `${senderName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
    link: createPageUrl('Chat') + `?appointment=${appointment.id}`,
    appointmentId: appointment.id
  });
}
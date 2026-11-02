
<div
  ref={cardRef}
  className="print-card"
  style={{
    width: 380,
    height: 660,
    margin: '0 auto',
    position: 'relative',
    overflow: 'visible',
    borderRadius: 24,
    background: 'transparent',
    border: `2px solid ${GOLD}`,
    boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
    fontFamily: 'Arial, sans-serif',
    color: BLACK,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }}
>
  {/* GOLD TOP ACCENT */}
  <div
    style={{
      width: '100%',
      height: 7,
      flexShrink: 0,
      borderRadius: '20px 20px 0 0',
      background: `linear-gradient(90deg, #72500B, ${LIGHT_GOLD}, ${GOLD}, #72500B)`,
    }}
  />

  {/* HEADER */}
  <div
    style={{
      width: '100%',
      padding: '22px 18px 15px',
      textAlign: 'center',
      borderBottom: `1px solid rgba(212,175,55,0.65)`,
    }}
  >
    <div
      style={{
        width: 52,
        height: 52,
        margin: '0 auto 9px',
        border: `2px solid ${GOLD}`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: GOLD,
        fontSize: 24,
        fontWeight: 900,
      }}
    >
      G
    </div>

    <div
      style={{
        color: BLACK,
        fontSize: 23,
        fontWeight: 900,
        letterSpacing: 3,
      }}
    >
      GLAMOUR
    </div>

    <div
      style={{
        color: '#A47A16',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 3,
        marginTop: 4,
      }}
    >
      UNISEX SALOON
    </div>

    <div
      style={{
        marginTop: 9,
        color: '#72550F',
        fontSize: 9,
        letterSpacing: 2,
        fontWeight: 800,
      }}
    >
      STAFF ATTENDANCE CARD
    </div>
  </div>

  {/* STAFF DETAILS */}
  <div
    style={{
      width: '100%',
      padding: '17px 18px 12px',
      textAlign: 'center',
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 65,
        height: 65,
        margin: '0 auto 9px',
        borderRadius: '50%',
        padding: 3,
        background: `linear-gradient(135deg, ${LIGHT_GOLD}, #806017, ${GOLD})`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#A47A16',
          fontSize: 25,
          fontWeight: 900,
        }}
      >
        {initials || 'G'}
      </div>
    </div>

    <div
      style={{
        color: BLACK,
        fontSize: 20,
        fontWeight: 900,
        letterSpacing: 0.4,
        lineHeight: 1.3,
        overflowWrap: 'anywhere',
      }}
    >
      {staffName}
    </div>

    <div
      style={{
        display: 'inline-block',
        marginTop: 7,
        padding: '5px 17px',
        border: `1px solid ${GOLD}`,
        borderRadius: 30,
        color: '#806017',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
      }}
    >
      {position}
    </div>
  </div>

  {/* QR CODE - DEDICATED CENTRED SECTION */}
  <div
    style={{
      width: '100%',
      flex: '1 1 auto',
      minHeight: 245,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 20px',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        color: '#806017',
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 1.8,
        marginBottom: 10,
      }}
    >
      YOUR ATTENDANCE QR CODE
    </div>

    <div
      style={{
        width: 205,
        height: 205,
        padding: 9,
        boxSizing: 'border-box',
        background: '#fff',
        border: `3px solid ${GOLD}`,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img
        src={qrImage}
        alt="Staff attendance QR code"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          maxWidth: 'none',
          maxHeight: 'none',
          margin: 0,
        }}
      />
    </div>

    <div
      style={{
        marginTop: 8,
        maxWidth: '100%',
        color: '#806017',
        fontSize: 9,
        letterSpacing: 0.5,
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      }}
    >
      {qrCode}
    </div>
  </div>

  {/* FOOTER */}
  <div
    style={{
      width: '100%',
      flexShrink: 0,
      padding: '13px 15px 15px',
      textAlign: 'center',
      borderTop: `1px solid rgba(212,175,55,0.65)`,
    }}
  >
    <div
      style={{
        fontSize: 10,
        fontWeight: 900,
        color: '#806017',
        letterSpacing: 1.8,
      }}
    >
      SCAN TO RECORD ATTENDANCE
    </div>

    <div
      style={{
        marginTop: 5,
        fontSize: 8,
        color: '#9B824A',
        letterSpacing: 1,
      }}
    >
      PROPERTY OF GLAMOUR UNISEX SALOON
    </div>

    <div
      style={{
        margin: '10px auto 0',
        width: 70,
        height: 3,
        borderRadius: 10,
        background: `linear-gradient(90deg, #72500B, ${LIGHT_GOLD}, ${GOLD})`,
      }}
    />
  </div>
</div>

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TimeSlot is ERC721, Ownable, ReentrancyGuard {
    struct Slot {
        string date;
        string time;
        uint256 price;
        bool booked;
        bool paymentReleased;
        string meetingId;
        string joinUrl;
        address bookedBy;
    }

    uint256 public nextTokenId = 1;
    mapping(uint256 => Slot) public slots;
    mapping(bytes32 => uint256) public bookingKeyToSlotId;
    
    event SlotMinted(uint256 indexed slotId, address indexed owner, string date, string time, uint256 price);
    event SlotBooked(uint256 indexed slotId, address indexed booker, bytes32 bookingKey);
    event PaymentReleased(uint256 indexed slotId, address indexed provider, uint256 amount);

    constructor(address initialOwner) ERC721("TimeSlot", "TSLOT") Ownable(initialOwner) {}

    /// @notice Mint a time slot NFT
    function mintSlot(
        string memory date,
        string memory time,
        uint256 price,
        address to,
        string memory meetingId,
        string memory joinUrl
    ) external returns (uint256) {
        uint256 slotId = nextTokenId++;
        
        slots[slotId] = Slot({
            date: date,
            time: time,
            price: price,
            booked: false,
            paymentReleased: false,
            meetingId: meetingId,
            joinUrl: joinUrl,
            bookedBy: address(0)
        });
        
        _safeMint(to, slotId);
        
        emit SlotMinted(slotId, to, date, time, price);
        return slotId;
    }

    /// @notice Book an available slot and hold payment in escrow
    function bookSlot(uint256 slotId) external payable nonReentrant returns (bytes32) {
        require(_exists(slotId), "Slot does not exist");
        
        Slot storage slot = slots[slotId];
        require(!slot.booked, "Slot already booked");
        require(msg.value == slot.price, "Incorrect payment amount");
        require(ownerOf(slotId) != msg.sender, "Cannot book your own slot");
        
        slot.booked = true;
        slot.bookedBy = msg.sender;
        
        // Generate unique booking key
        bytes32 bookingKey = keccak256(
            abi.encodePacked(slotId, msg.sender, block.timestamp, block.difficulty)
        );
        bookingKeyToSlotId[bookingKey] = slotId;
        
        emit SlotBooked(slotId, msg.sender, bookingKey);
        return bookingKey;
    }

    /// @notice Get the price of a specific slot
    function slotPrice(uint256 slotId) external view returns (uint256) {
        require(_exists(slotId), "Slot does not exist");
        return slots[slotId].price;
    }

    /// @notice Get comprehensive slot information
    function getSlotInfo(uint256 slotId) external view returns (
        string memory date,
        string memory time,
        uint256 price,
        bool booked,
        bool paymentReleased,
        string memory meetingId,
        string memory joinUrl,
        address bookedBy,
        address owner
    ) {
        require(_exists(slotId), "Slot does not exist");
        
        Slot memory slot = slots[slotId];
        return (
            slot.date,
            slot.time,
            slot.price,
            slot.booked,
            slot.paymentReleased,
            slot.meetingId,
            slot.joinUrl,
            slot.bookedBy,
            ownerOf(slotId)
        );
    }

    /// @notice Get slot info by booking key
    function getSlotByBookingKey(bytes32 bookingKey) external view returns (
        uint256 slotId,
        string memory date,
        string memory time,
        uint256 price,
        bool booked,
        bool paymentReleased,
        string memory meetingId,
        string memory joinUrl,
        address bookedBy,
        address owner
    ) {
        slotId = bookingKeyToSlotId[bookingKey];
        require(slotId != 0, "Invalid booking key");
        
        Slot memory slot = slots[slotId];
        return (
            slotId,
            slot.date,
            slot.time,
            slot.price,
            slot.booked,
            slot.paymentReleased,
            slot.meetingId,
            slot.joinUrl,
            slot.bookedBy,
            ownerOf(slotId)
        );
    }

    /// @notice Release payment to slot owner (called by booker after service delivery)
    function releasePayment(uint256 slotId) external nonReentrant {
        require(_exists(slotId), "Slot does not exist");
        
        Slot storage slot = slots[slotId];
        require(slot.booked, "Slot not booked");
        require(!slot.paymentReleased, "Payment already released");
        require(msg.sender == slot.bookedBy, "Only booker can release payment");
        
        slot.paymentReleased = true;
        address payable provider = payable(ownerOf(slotId));
        uint256 amount = slot.price;
        
        (bool success, ) = provider.call{value: amount}("");
        require(success, "Payment transfer failed");
        
        emit PaymentReleased(slotId, provider, amount);
    }

    /// @notice Emergency function to refund booker (called by owner)
    function emergencyRefund(uint256 slotId) external onlyOwner nonReentrant {
        require(_exists(slotId), "Slot does not exist");
        
        Slot storage slot = slots[slotId];
        require(slot.booked, "Slot not booked");
        require(!slot.paymentReleased, "Payment already released");
        
        address payable booker = payable(slot.bookedBy);
        uint256 amount = slot.price;
        
        slot.booked = false;
        slot.bookedBy = address(0);
        
        (bool success, ) = booker.call{value: amount}("");
        require(success, "Refund transfer failed");
    }

    /// @notice Check if a token exists
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId < nextTokenId;
    }

    /// @notice Get contract balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get all slots owned by an address
    function getSlotsOwnedBy(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory result = new uint256[](tokenCount);
        uint256 resultIndex = 0;
        
        for (uint256 i = 1; i < nextTokenId; i++) {
            if (ownerOf(i) == owner) {
                result[resultIndex] = i;
                resultIndex++;
            }
        }
        
        return result;
    }
}